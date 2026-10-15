/**
 * FAQ uses the existing SupportFaq collection.
 * Do not create a second MongoDB model or collection.
 */
export {
    SupportFaq,
} from "../support/support-faq.model";

export type {
    SupportFaqFields,
    SupportFaqDocument,
} from "../support/support-faq.model";
