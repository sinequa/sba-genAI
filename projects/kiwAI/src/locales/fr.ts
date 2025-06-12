import {LocaleData} from "@sinequa/core/intl";
import d3Format from "../../../../node_modules/d3-format/locale/fr-FR.json";
import d3Time from "../../../../node_modules/d3-time-format/locale/fr-FR.json";
import {frCore} from "@sinequa/core";
import appMessages from "./messages/fr.json";
import "intl/locale-data/jsonp/fr-FR"; // Safari
import "@formatjs/intl-relativetimeformat/dist/locale-data/fr";
import {Utils} from "@sinequa/core/base";
import {frUtils} from "@sinequa/components/utils";
import {frFacet} from "@sinequa/components/facet";
import {frMetadata} from "@sinequa/components/metadata";
import {frNotification} from "@sinequa/components/notification";
import {frPreview} from "@sinequa/components/preview";
import {frResult} from "@sinequa/components/result";
import {frSearch} from "@sinequa/components/search";
import {frUserSettings} from "@sinequa/components/user-settings";
import {frML} from "@sinequa/components/machine-learning";
import {frFilters} from "@sinequa/components/filters";

d3Format.thousands = " "; // consistency with intl-number-format

const messages = Utils.merge({}, frCore, frUtils, frFacet, frMetadata,
    frNotification, frPreview, frResult, frSearch, frUserSettings,
    frML, frFilters, appMessages);

export default <LocaleData>{
    intl: {
        locale: "fr-FR"
    },
    moment: {
        locale: "fr"
    },
    d3: {
        locale: "fr-FR",
        format: d3Format,
        time: d3Time
    },
    messages: messages
};
