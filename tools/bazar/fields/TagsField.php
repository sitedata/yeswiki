<?php

namespace YesWiki\Bazar\Field;

use Psr\Container\ContainerInterface;
use YesWiki\Core\Service\TripleStore;
use YesWiki\Tags\Service\TagsManager;

/**
 * @Field({"tags"})
 */
class TagsField extends BazarField
{
    public function __construct(array $values, ContainerInterface $services)
    {
        parent::__construct($values, $services);

        $this->maxChars = $this->maxChars ?? 255;
    }

    public function renderInput($entry)
    {
        $tagsManager = $this->getService(TagsManager::class);

        $value = $this->getValue($entry);

        $allTags = $tagsManager->getAll();
        if (is_array($allTags)) {
            foreach ($allTags as $tag) {
                // TODO why ISO-8859-15 ? fix the encoding ???
                $response[] = _convert(str_replace('\'', '&#39;', $tag['value']), 'ISO-8859-15');
            }
        }
        sort($response);
        $allTags = '\'' . implode('\',\'', $response) . '\'';

        $script = '$(function(){
            var tagsexistants = [' . $allTags . '];
            var pagetag = $(\'#formulaire .yeswiki-input-pagetag\');
            pagetag.tagsinput({
                typeahead: {
                    afterSelect: function(val) { this.$element.val(""); },
                    source: tagsexistants
                },
                confirmKeys: [13, 186, 188]
            });
        });';

        $GLOBALS['wiki']->AddJavascript($script);

        if (!isset($value)) {
            if (isset($_GET[$this->propertyName])) {
                $value = stripslashes($_GET[$this->propertyName]);
            } else {
                $value = stripslashes($this->default);
            }
        }

        $GLOBALS['wiki']->AddJavascriptFile('tools/tags/libs/vendor/bootstrap-tagsinput.min.js');

        return $this->render('@bazar/inputs/tags.twig', [
            'value' => $value,
            'allTags' => $allTags
        ]);
    }

    public function formatValuesBeforeSave($entry)
    {
        // TODO use TagsManager instead of TripleStore
        $tripleStore = $this->getService(TripleStore::class);

        $value = $this->getValue($entry);

        // Delete existing tags linked to this entry
        if (!isset($GLOBALS['delete_tags'])) {
            $tripleStore->delete($entry['id_fiche'], 'http://outils-reseaux.org/_vocabulary/tag', null, '', '');
            $GLOBALS['delete_tags'] = true;
        }

        // Add back all specified tags
        $tags = explode(",", $value);
        foreach ($tags as $tag) {
            trim($tag);
            if ($tag != '') {
                $tripleStore->create($entry['id_fiche'], 'http://outils-reseaux.org/_vocabulary/tag', _convert($tag, YW_CHARSET, true), '', '');
            }
        }

        return [$this->propertyName => $value];
    }

    public function renderStatic($entry)
    {
        $value = $this->getValue($entry);

        $tags = explode(',', $value);

        if (count($tags) > 0 && !empty($tags[0])) {
            sort($tags);
            $tags = array_map(function($tag) {
                return '<a class="tag-label label label-info" href="' . $GLOBALS['wiki']->href('listpages', $GLOBALS['wiki']->GetPageTag(), 'tags=' . urlencode(trim($tag))) . '" title="' . _t('TAGS_SEE_ALL_PAGES_WITH_THIS_TAGS') . '">' . $tag . '</a>';
            }, $tags);

            return $this->render('@bazar/fields/tags.twig', [
                'value' => join(' ', $tags) ?? ''
            ]);
        } else {
            return null ;
        }
    }
}