const ConditionsChecking = {
    conditionsCache: [],
    fieldNamesCache: {},
    triggersCache: {},
    operationsLists: ['&','|','(',')','!('],
    conditionsList: ['=','!=',' in (',' in(','.length =','.length !=','.length <','.length <=','.length >=','.length >'],
    getFirstOperation: function (parsingObject){
        let condition = parsingObject.restOfCondition.trim();
        let indexOfOperation = -1;
        let  operation = "";
        for (let index = 0; index < this.operationsLists.length; index++) {
            let element = this.operationsLists[index];
            let newIndex = condition.indexOf(element);
            if (element == "(" && (condition.substr(newIndex-4,5) == " in (" || condition.substr(newIndex-3,4) == " in(")){
                newIndex = -1;
            }
            if ( newIndex > -1 && (newIndex < indexOfOperation || indexOfOperation < 0)){
                indexOfOperation = newIndex;
                operation = element;
            }
        }
        let result = {};
        if (indexOfOperation < 0){
            result.currentCondition = condition;
            result.restOfCondition = "";
            result.operation = "";
        } else {
            result.currentCondition = condition.substr(0,indexOfOperation).trim();
            result.operation = operation;
            result.restOfCondition = condition.substr(indexOfOperation+operation.length).trim();
        }
        return result;
    },
    addCondition: function (condition, baseObject){
        let conditionLocal = condition.trim();
        let indexOfCondition = -1;
        let typeOfCondition = "";
        for (let index = 0; index < this.conditionsList.length; index++) {
            let element = this.conditionsList[index];
            let newIndex = conditionLocal.indexOf(element);
            if ( newIndex > -1 && (newIndex < indexOfCondition || indexOfCondition < 0)){
                indexOfCondition = newIndex;
                typeOfCondition = element;
            }
        }
        if (indexOfCondition < 0){
            baseObject.leftPart = "";
            baseObject.rigthPart = "";
            baseObject.typeOfCondition = "";
        } else {
            baseObject.leftPart = conditionLocal.substr(0,indexOfCondition).trim();
            baseObject.typeOfCondition = typeOfCondition;
            baseObject.rigthPart = conditionLocal.substr(indexOfCondition+typeOfCondition.length).trim();
        }
    },
    getCheckboxValues: function (field){
        let result = [];
        $(field).find("input[type=checkbox]").each(function(){
            if ($(this).prop('checked') == true){
                let name = $(this).attr('name');
                let value = name.match(/\[[A-Za-z0-9_-]+\]/)[0];
                value = value.substr(1,value.length-2);
                result.push(value);
            }
        });
        return result;
    },
    getCheckboxTagValues: function (field){
        let result = [];
        let value = $(field).val();
        if (value.trim() != ""){
            result = value.split(",");
        }
        return result;
    },
    getRadioValues: function (inputs){
        let result = [];
        $(inputs).each(function(){
            if ($(this).prop('checked') == true){
                result.push($(this).attr('value'));
            }
        });
        return result;
    },
    getSelectValues: function (field){
        let result = [];
        let value = $(field).val();
        if (value.trim() !=""){
            result.push(value.trim());
        }
        return result;
    },
    getFieldNameValues: function(fieldName){
        if (typeof this.fieldNamesCache[fieldName] === "undefined"){
            return [];
        }
        let fieldData = this.fieldNamesCache[fieldName];
        switch (fieldData.type) {
            case "checkbox":
                return this.getCheckboxValues(fieldData.node);
            case "checkboxtag":
                return this.getCheckboxTagValues(fieldData.node);
            case "radio":
                return this.getRadioValues(fieldData.node);
            case "select":
                return this.getSelectValues(fieldData.node);
            default:
                break;
        }
        return [];
    },
    extractValues: function(values){
        if (values.trim()==""){
            return [];
        }
        return values.split(",");
    },
    commonForOperations: function(fieldName, values, extract){
        let fieldValues = this.getFieldNameValues(fieldName);
        let extractedValues = this.extractValues(values);
        for (let index = 0; index < extractedValues.length; index++) {
            if (extract.uniqueValues.indexOf(extractedValues[index].trim()) == -1){
                extract.uniqueValues.push(extractedValues[index].trim());
            }
        }
        for (let index = 0; index < fieldValues.length; index++) {
            if (extract.uniqueFieldValues.indexOf(fieldValues[index].trim()) == -1){
                extract.uniqueFieldValues.push(fieldValues[index].trim());
            }
        }
    },
    isLength: function (fieldName, values, operation){
        if (isNaN(values)){
            return false;
        }
        let fieldValues = this.getFieldNameValues(fieldName);
        let uniqueFieldValues = [];
        for (let index = 0; index < fieldValues.length; index++) {
            if (uniqueFieldValues.indexOf(fieldValues[index].trim()) == -1){
                uniqueFieldValues.push(fieldValues[index].trim());
            }
        }
        let length = fieldValues.length;
        let number = Number(values);
        return eval(length+" "+operation+" "+number);
    },
    isEqual: function (fieldName, values){
        let extract = {
            uniqueValues: [],
            uniqueFieldValues: []
        };
        this.commonForOperations(fieldName, values, extract);
        if (extract.uniqueValues.length != extract.uniqueFieldValues.length){
            return false;
        }
        let result = true;
        for (let index = 0; index < extract.uniqueFieldValues.length; index++) {
            if (extract.uniqueValues.indexOf(extract.uniqueFieldValues[index]) == -1){
                result = false
            }
        }
        return result;
    },
    isUnEqual: function (fieldName, values){
        let extract = {
            uniqueValues: [],
            uniqueFieldValues: []
        };
        this.commonForOperations(fieldName, values, extract);
        if (extract.uniqueValues.length != extract.uniqueFieldValues.length){
            return true;
        }
        let result = false;
        for (let index = 0; index < extract.uniqueFieldValues.length; index++) {
            if (extract.uniqueValues.indexOf(extract.uniqueFieldValues[index]) == -1){
                result = true;
            }
        }
        return result;
    },
    isIn: function (fieldName, values){
        let extract = {
            uniqueValues: [],
            uniqueFieldValues: []
        };
        this.commonForOperations(fieldName, values, extract);
        if (extract.uniqueFieldValues.length == 0){
            return false;
        }
        let result = false;
        for (let index = 0; index < extract.uniqueFieldValues.length; index++) {
            if (extract.uniqueValues.indexOf(extract.uniqueFieldValues[index]) > -1){
                result = true;
            }
        }
        return result;
    },
    renderCondition: function(structuredCondition){
        if (typeof structuredCondition.leftPart !== "undefined" &&
            typeof structuredCondition.rigthPart !== "undefined" &&
            typeof structuredCondition.typeOfCondition !== "undefined"){
            return this.renderConditionSecured(
                structuredCondition.leftPart.trim(),
                structuredCondition.typeOfCondition.trim(),
                structuredCondition.rigthPart.trim()
            );
        }
        return "";
    },
    renderConditionSecured: function(fieldName, condition, values){
        switch (condition) {
            case "=":
                return ` this.isEqual("${fieldName}","${values}")`;
            case "!=":
                return ` this.isUnEqual("${fieldName}","${values}")`;
            case 'in (':
            case 'in(':
                return ` this.isIn("${fieldName}","${values}")`;
            case '.length =':
            case '.length !=':
            case '.length <':
            case '.length <=':
            case '.length >':
            case '.length >=':
                return ` this.isLength("${fieldName}","${values}","${condition.substr(".length ".length)}")`;
            default:
                break;
        }
        return " false ";
    },
    renderBadFormatingError: function (structuredCondition){
        if (typeof structuredCondition.leftPart !== "undefined") {
            console.warn(`${structuredCondition.leftPart} is not waited before '${structuredCondition.operation}' in '${conditionData.condition}'`);
            return true;
        }
        return false;
    },
    resolveCondition: function (id){
        if (typeof this.conditionsCache[id] !== "undefined"){
            let conditionData = this.conditionsCache[id];
            let stack = [];
            for (let key in conditionData.structuredConditions) {
                stack.push(conditionData.structuredConditions[key]);
            }
            let stringToEval = "";
            let errorFound = false;
            while (stack.length > 0 && !errorFound) {
                let structuredCondition = stack[0];
                stack.splice(0,1);
                switch (structuredCondition.operation) {
                    case "(":
                    case "!(":
                        if (this.renderBadFormatingError(structuredCondition)) {
                            errorFound = true;
                        } else {
                            stringToEval = stringToEval+structuredCondition.operation
                        }
                        break;
                    case ")":
                        stringToEval = stringToEval+this.renderCondition(structuredCondition)+structuredCondition.operation
                        break;
                    case "&":
                    case "|":
                        stringToEval = stringToEval+this.renderCondition(structuredCondition)+structuredCondition.operation+structuredCondition.operation;
                        break;
                    default:
                        if (stack.length > 0){
                            error = true;
                            console.warn(`Unknown operation '${structuredCondition.operation}' in '${conditionData.condition}'`);
                        }
                        stringToEval = stringToEval+this.renderCondition(structuredCondition);
                        break;
                }
            }
            let display = false;
            try {
                display = errorFound ? false : eval(stringToEval);
            } catch (error) {
                console.warn(error);
                display = false;
            }
            // for debug console.log(stringToEval+" => "+display)
            if (display) {
                $(conditionData.node).show();
            } else {
                $(conditionData.node).hide();
            }
        }
    },
    resolveTrigger: function (inputId){
        if (typeof this.triggersCache[inputId] !== "undefined"){
            let fieldsNames = this.triggersCache[inputId];
            let conditionsIds = [];
            for (let index = 0; index < fieldsNames.length; index++) {
                let fieldName = fieldsNames[index];
                if (typeof this.fieldNamesCache[fieldName] !== "undefined"){
                    let fieldData = this.fieldNamesCache[fieldName];
                    for (let indexCondition = 0; indexCondition < fieldData.conditionIds.length; indexCondition++) {
                        let id = fieldData.conditionIds[indexCondition];
                        if (conditionsIds.indexOf(id) < 0){
                            conditionsIds.push(id);
                        }
                    }
                }
            }
            for (let index = 0; index < conditionsIds.length; index++) {
                let id = conditionsIds[index];
                this.resolveCondition(id);
            }
        }
    },
    registerTrigger: function (input, fieldName){
        let inputId = $(input).attr('id');
        if (typeof this.triggersCache[inputId] === "undefined"){
            this.triggersCache[inputId] = [fieldName];
            $(input).on('change',function(){
                ConditionsChecking.resolveTrigger(inputId);
            });
        } else if (this.triggersCache[inputId].indexOf(fieldName) < 0) {
            this.triggersCache[inputId].push(fieldName);
        }
    },
    findCheckbox: function(fieldName,result){
        if (result.type != ""){
            return result;
        }
        let node = $(`div[class$=${fieldName}]`);
        if (node.length > 0){
            let inputs = $(node).find('input[type=checkbox]');
            if (inputs.length > 0 ){
                result.type = "checkbox";
                result.node = node;
                // register triggers
                $(inputs).each(function(){
                    ConditionsChecking.registerTrigger(this,fieldName);
                });
            }
        }
        return result;
    },
    findCheckboxTag: function(fieldName,result){
        if (result.type != ""){
            return result;
        }
        let node = $(`input[class$=${fieldName}].yeswiki-input-entries`);
        if (node.length > 0){
            result.type = "checkboxtag";
            result.node = node;
            // register triggers
            ConditionsChecking.registerTrigger(node,fieldName)
        }
        return result;
    },
    findList: function(fieldName,result){
        if (result.type != ""){
            return result;
        }
        let node = $(`select[name$=${fieldName}]`);
        if (node.length > 0){
            result.type = "select";
            result.node = node;
            // register triggers
            ConditionsChecking.registerTrigger(node,fieldName);
        }
        return result;
    },
    findRadio: function(fieldName,result){
        if (result.type != ""){
            return result;
        }
        let inputs = $(`input[name$=${fieldName}][type=radio]`);
        if (inputs.length > 0){
            result.type = "radio";
            result.node = inputs;
            // register triggers
            $(inputs).each(function(){
                ConditionsChecking.registerTrigger(this,fieldName);
            });
        }
        return result;
    },
    extractFieldNode: function(fieldName){
        let result = {
            type:"",
            node:{},
            conditionIds: []
        };
        result = this.findCheckbox(fieldName, result);
        result = this.findCheckboxTag(fieldName, result);
        result = this.findRadio(fieldName, result);
        result = this.findList(fieldName, result);

        return result;
    },
    registerFieldName: function(fieldName, id){
        if (typeof this.fieldNamesCache[fieldName] === "undefined"){
            this.fieldNamesCache[fieldName] = this.extractFieldNode(fieldName);
            this.fieldNamesCache[fieldName].conditionIds.push(id);
        } else if(this.fieldNamesCache[fieldName].conditionIds.indexOf(id) < 0) {
            this.fieldNamesCache[fieldName].conditionIds.push(id);
        }
    },
    parseCondition: function (element) {
        let condition = $(element).data("conditionschecking");
        // index = internal id
        let id = this.conditionsCache.length;
        // save cache
        this.conditionsCache.push({
            condition:condition,
            node:element,
            structuredConditions: {}
        });

        let parsingObject = {
            restOfCondition: condition,
            currentCondition: "",
            operation: ""
        }
        while (parsingObject.restOfCondition.length > 0) {
            parsingObject = this.getFirstOperation(parsingObject);
            // check condition
            let indexForStructuredCondition = Object.keys(this.conditionsCache[id].structuredConditions).length;
            // save in cache
            this.conditionsCache[id].structuredConditions[indexForStructuredCondition] = {
                operation:parsingObject.operation
            };
            let structuredCondition = this.conditionsCache[id].structuredConditions[indexForStructuredCondition];
            if (parsingObject.currentCondition.length > 0){
                this.addCondition(
                    parsingObject.currentCondition,
                    structuredCondition);
            }
            // activate trigger
            if (typeof structuredCondition.leftPart !== "undefined" && structuredCondition.leftPart.length > 0){
                let fieldName = structuredCondition.leftPart.trim();
                this.registerFieldName(fieldName,id);
            }
        }
        let structuredConditions = this.conditionsCache[id].structuredConditions;
        if (Object.keys(structuredConditions).length > 0){
            // clean ')' after 'in 
            let indexesToRemove = [];
            for (let index = 1; index < Object.keys(structuredConditions).length; index++) {
                let previousStructuredCondition = structuredConditions[index-1];
                let currentStructuredCondition = structuredConditions[index];
                if ((
                        previousStructuredCondition.typeOfCondition == " in (" ||
                        previousStructuredCondition.typeOfCondition == " in("
                    ) && previousStructuredCondition.operation == ")"
                    && typeof currentStructuredCondition.leftPart == "undefined"
                    ){
                    structuredConditions[index - 1].operation = currentStructuredCondition.operation;
                    indexesToRemove.push(index);
                }
            }
            let lastStructuredCondition = structuredConditions[Object.keys(structuredConditions).length-1];
            if ((
                    lastStructuredCondition.typeOfCondition == " in (" ||
                    lastStructuredCondition.typeOfCondition == " in("
                ) && lastStructuredCondition.operation == ")"){
                structuredConditions[Object.keys(structuredConditions).length-1].operation = "";
            }
            let delta = 0;
            let maxIndex = Object.keys(structuredConditions).length;
            for (let index = 1; index < maxIndex; index++) {
                if (indexesToRemove.indexOf(index) > -1){
                    delete this.conditionsCache[id].structuredConditions[index];
                    delta = delta + 1;
                } else if (delta > 0){
                    this.conditionsCache[id].structuredConditions[index-delta] = this.conditionsCache[id].structuredConditions[index];
                    delete this.conditionsCache[id].structuredConditions[index];
                }
            }
        }
    },
    init: function() {
        let conditionschecking = this;
        $("div[data-conditionschecking]").each(function (){
            let element = $(this);
            conditionschecking.parseCondition(element);
        });
        // init conditions
        for (let index = 0; index < this.conditionsCache.length; index++) {
            this.resolveCondition(index);
        }
    }
}

ConditionsChecking.init();