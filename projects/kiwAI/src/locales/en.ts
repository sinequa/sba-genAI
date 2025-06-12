import {LocaleData} from "@sinequa/core/intl";
import d3Format from "../../../../node_modules/d3-format/locale/en-US.json";
import d3Time from "../../../../node_modules/d3-time-format/locale/en-US.json";
import {enCore} from "@sinequa/core";
import appMessages from "./messages/en.json";
import "intl/locale-data/jsonp/en-US"; // Safari
import {Utils} from "@sinequa/core/base";
import {enUtils} from "@sinequa/components/utils";
import {enFacet} from "@sinequa/components/facet";
import {enMetadata} from "@sinequa/components/metadata";
import {enNotification} from "@sinequa/components/notification";
import {enPreview} from "@sinequa/components/preview";
import {enResult} from "@sinequa/components/result";
import {enSearch} from "@sinequa/components/search";
import {enUserSettings} from "@sinequa/components/user-settings";
import {enML} from "@sinequa/components/machine-learning";
import {enFilters} from "@sinequa/components/filters";

const messages = Utils.merge({}, enCore, enUtils, enFacet, enMetadata,
    enNotification, enPreview, enResult, enSearch, enUserSettings,
    enML, enFilters, appMessages);

export default <LocaleData>{
    intl: {
        locale: "en-US"
    },
    d3: {
        locale: "en-US",
        format: d3Format,
        time: d3Time
    },
    messages: messages
};
