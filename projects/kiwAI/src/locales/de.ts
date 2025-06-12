import {LocaleData} from "@sinequa/core/intl";
import d3Format from "../../../../node_modules/d3-format/locale/de-DE.json";
import d3Time from "../../../../node_modules/d3-time-format/locale/de-DE.json";
import {deCore} from "@sinequa/core";
import appMessages from "./messages/de.json";
import "intl/locale-data/jsonp/de-DE"; // Safari
import "@formatjs/intl-relativetimeformat/dist/locale-data/de";
import {Utils} from "@sinequa/core/base";
import {deUtils} from "@sinequa/components/utils";
import {deFacet} from "@sinequa/components/facet";
import {deMetadata} from "@sinequa/components/metadata";
import {deNotification} from "@sinequa/components/notification";
import {dePreview} from "@sinequa/components/preview";
import {deResult} from "@sinequa/components/result";
import {deSearch} from "@sinequa/components/search";
import {deUserSettings} from "@sinequa/components/user-settings";
import {deML} from "@sinequa/components/machine-learning";
import {deFilters} from "@sinequa/components/filters";

const messages = Utils.merge({}, deCore, deUtils, deFacet, deMetadata,
    deNotification, dePreview, deResult, deSearch, deUserSettings,
    deML, deFilters, appMessages);

export default <LocaleData>{
    intl: {
        locale: "de-DE"
    },
    moment: {
        locale: "de"
    },
    d3: {
        locale: "de-DE",
        format: d3Format,
        time: d3Time
    },
    messages: messages
};
