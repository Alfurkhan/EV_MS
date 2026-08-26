import { useState } from "react";
import toast from "react-hot-toast";

import Button from "../../../components/ui/Button";

type Props = {
    onAccept: () => void;
    onClose: () => void;
};

export default function TermsAndConditionsModal({
                                                    onAccept,
                                                    onClose,
                                                }: Props) {

    const [accepted, setAccepted] =
        useState(false);


    const handleAccept = () => {

        if (!accepted) {

            toast.error(
                "Please accept the Terms and Conditions to continue."
            );

            return;
        }

        onAccept();
    };


    return (

        <div
            className="
                fixed
                inset-0
                z-50
                flex
                items-center
                justify-center
                bg-black/50
                p-4
            "
        >

            <div
                className="
                    flex
                    max-h-[90vh]
                    w-full
                    max-w-3xl
                    flex-col
                    overflow-hidden
                    rounded-2xl
                    bg-white
                    shadow-2xl
                "
            >

                {/* HEADER */}

                <div
                    className="
                        shrink-0
                        border-b
                        border-slate-200
                        px-6
                        py-5
                    "
                >

                    <div className="flex items-start justify-between gap-4">

                        <div>

                            <h2
                                className="
                                    text-2xl
                                    font-bold
                                    text-slate-900
                                "
                            >
                                Terms and Conditions
                            </h2>

                            <p
                                className="
                                    mt-1
                                    text-sm
                                    text-slate-500
                                "
                            >
                                Please review these terms carefully
                                before creating your E-Vidyalaya account.
                            </p>

                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            className="
                                flex
                                h-9
                                w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-lg
                                text-xl
                                text-slate-400
                                transition
                                hover:bg-slate-100
                                hover:text-slate-700
                            "
                            aria-label="Close Terms and Conditions"
                        >
                            ×
                        </button>

                    </div>

                    <div
                        className="
                            mt-4
                            flex
                            flex-wrap
                            gap-x-6
                            gap-y-1
                            text-xs
                            text-slate-500
                        "
                    >

                        <span>
                            Version: <strong>1.0</strong>
                        </span>

                        <span>
                            Last Updated: <strong>August 2026</strong>
                        </span>

                    </div>

                </div>


                {/* TERMS CONTENT */}

                <div
                    className="
                        flex-1
                        overflow-y-auto
                        px-6
                        py-6
                    "
                >

                    <div
                        className="
                            space-y-6
                            text-sm
                            leading-6
                            text-slate-600
                        "
                    >

                        {/* 1 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                1. Acceptance of Terms
                            </h3>

                            <p className="mt-2">

                                Welcome to E-Vidyalaya. By creating an account
                                or using the E-Vidyalaya platform, you acknowledge
                                that you have read, understood, and agree to be
                                bound by these Terms and Conditions.

                                {" "}If you do not agree with these terms,
                                please do not create or use an E-Vidyalaya account.

                            </p>

                        </section>


                        {/* 2 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                2. Eligibility and Account Registration
                            </h3>

                            <p className="mt-2">

                                You must provide the information requested during
                                registration and use the platform only for lawful
                                and legitimate educational purposes.

                                {" "}You are responsible for ensuring that the
                                information associated with your account is accurate,
                                complete, and kept up to date.

                            </p>

                        </section>


                        {/* 3 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                3. Email Verification
                            </h3>

                            <p className="mt-2">

                                E-Vidyalaya may require you to verify your email
                                address before completing registration.

                                {" "}The verification code sent to your email is
                                intended only for the person attempting to create
                                the account and should not be shared with others.

                            </p>

                        </section>


                        {/* 4 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                4. Accuracy of Information
                            </h3>

                            <p className="mt-2">

                                You agree to provide truthful and accurate
                                information when creating and using your account.

                                {" "}Providing false, misleading, impersonated,
                                or intentionally inaccurate information may result
                                in restriction, suspension, or termination of your
                                account.

                            </p>

                        </section>


                        {/* 5 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                5. Account Security and Responsibility
                            </h3>

                            <p className="mt-2">

                                You are responsible for maintaining the
                                confidentiality of your login credentials and for
                                activities performed through your account.

                                {" "}You should not share your password, access
                                tokens, or other authentication information with
                                another person.

                            </p>

                            <p className="mt-2">

                                If you believe that your account has been
                                compromised or accessed without authorization,
                                you should notify the appropriate E-Vidyalaya
                                administrator or support contact as soon as possible.

                            </p>

                        </section>


                        {/* 6 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                6. Acceptable Use
                            </h3>

                            <p className="mt-2">

                                E-Vidyalaya is intended to support educational
                                activities and communication between authorized
                                users such as students, faculty, and administrators.

                                {" "}You agree to use the platform responsibly and
                                in accordance with applicable laws, institutional
                                policies, and these Terms and Conditions.

                            </p>

                        </section>


                        {/* 7 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                7. Educational Platform Usage
                            </h3>

                            <p className="mt-2">

                                Information, courses, assignments, attendance
                                records, notifications, and other educational
                                features available through E-Vidyalaya should be
                                used only for their intended educational purposes.

                                {" "}Users should not attempt to manipulate,
                                falsify, or interfere with academic records or
                                information maintained by the platform.

                            </p>

                        </section>


                        {/* 8 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                8. Privacy and Personal Information
                            </h3>

                            <p className="mt-2">

                                E-Vidyalaya may collect and process information
                                necessary to provide account, authentication,
                                educational, communication, and administrative
                                services.

                                {" "}This may include information such as your
                                name, email address, phone number, role, and
                                information related to your use of the platform.

                            </p>

                            <p className="mt-2">

                                Personal information should be handled in accordance
                                with applicable privacy requirements and the
                                platform's privacy practices.

                            </p>

                        </section>


                        {/* 9 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                9. User Content and Information
                            </h3>

                            <p className="mt-2">

                                Users may provide information or content while
                                using E-Vidyalaya, including academic or
                                communication-related information.

                                {" "}You are responsible for ensuring that any
                                information you submit is appropriate, lawful,
                                and does not knowingly violate the rights of others.

                            </p>

                        </section>


                        {/* 10 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                10. Prohibited Activities
                            </h3>

                            <p className="mt-2">

                                You must not use E-Vidyalaya to:

                            </p>

                            <ul
                                className="
                                    mt-2
                                    list-disc
                                    space-y-1
                                    pl-5
                                "
                            >

                                <li>
                                    Access accounts or information without authorization.
                                </li>

                                <li>
                                    Attempt to bypass authentication or security controls.
                                </li>

                                <li>
                                    Modify, delete, or manipulate academic records without authorization.
                                </li>

                                <li>
                                    Introduce malicious software, harmful code, or unauthorized scripts.
                                </li>

                                <li>
                                    Interfere with the availability or normal operation of the platform.
                                </li>

                                <li>
                                    Impersonate another user, faculty member, administrator, or institution.
                                </li>

                                <li>
                                    Use the platform for unlawful, fraudulent, abusive, or harmful activities.
                                </li>

                            </ul>

                        </section>


                        {/* 11 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                11. Account Suspension and Termination
                            </h3>

                            <p className="mt-2">

                                E-Vidyalaya administrators may restrict, suspend,
                                or terminate an account when there is a reasonable
                                basis to believe that the account has been used in
                                violation of these Terms, applicable policies, or
                                applicable law.

                                {" "}Where appropriate, users may be notified of
                                significant account restrictions or termination.

                            </p>

                        </section>


                        {/* 12 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                12. Service Availability
                            </h3>

                            <p className="mt-2">

                                E-Vidyalaya is provided as an educational platform
                                and may occasionally be unavailable because of
                                maintenance, upgrades, technical issues, network
                                failures, or circumstances beyond reasonable
                                control.

                                {" "}Reasonable efforts may be made to maintain
                                the availability and reliability of the platform,
                                but uninterrupted access cannot be guaranteed.

                            </p>

                        </section>


                        {/* 13 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                13. Changes to the Platform and Terms
                            </h3>

                            <p className="mt-2">

                                E-Vidyalaya may modify, improve, add, or remove
                                features of the platform from time to time.

                                {" "}These Terms and Conditions may also be
                                updated when necessary. Updated terms may be
                                communicated through the platform or other
                                appropriate channels.

                            </p>

                        </section>


                        {/* 14 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                14. Limitation of Responsibility
                            </h3>

                            <p className="mt-2">

                                E-Vidyalaya is intended to provide educational
                                management and communication functionality.

                                {" "}Users should verify important academic,
                                administrative, or institutional information
                                through the appropriate authorized channels when
                                necessary.

                            </p>

                        </section>


                        {/* 15 */}

                        <section>

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                15. Contact and Support
                            </h3>

                            <p className="mt-2">

                                If you experience an account, security, or
                                platform-related issue, please contact the
                                appropriate E-Vidyalaya administrator or designated
                                support team.

                            </p>

                        </section>


                        {/* FINAL */}

                        <section
                            className="
                                rounded-xl
                                border
                                border-blue-100
                                bg-blue-50
                                p-4
                            "
                        >

                            <h3
                                className="
                                    text-base
                                    font-semibold
                                    text-slate-900
                                "
                            >
                                16. Your Acceptance
                            </h3>

                            <p className="mt-2">

                                By selecting "Accept and Continue", you confirm
                                that you have read and understood these Terms and
                                Conditions and agree to follow them while using
                                E-Vidyalaya.

                            </p>

                        </section>

                    </div>

                </div>


                {/* ACCEPTANCE + ACTIONS */}

                <div
                    className="
                        shrink-0
                        border-t
                        border-slate-200
                        bg-white
                        px-6
                        py-5
                    "
                >

                    <label
                        className="
                            flex
                            cursor-pointer
                            items-start
                            gap-3
                            text-sm
                            text-slate-600
                        "
                    >

                        <input
                            type="checkbox"
                            checked={accepted}
                            onChange={(event) =>
                                setAccepted(
                                    event.target.checked
                                )
                            }
                            className="
                                mt-1
                                h-4
                                w-4
                                shrink-0
                                cursor-pointer
                                accent-blue-600
                            "
                        />

                        <span>

                            I have read and agree to the
                            {" "}
                            <strong className="text-slate-800">
                                Terms and Conditions
                            </strong>
                            {" "}of E-Vidyalaya.

                        </span>

                    </label>


                    <div
                        className="
                            mt-5
                            flex
                            flex-col-reverse
                            gap-3
                            sm:flex-row
                            sm:justify-end
                        "
                    >

                        <button
                            type="button"
                            onClick={onClose}
                            className="
                                h-14
                                rounded-xl
                                border
                                border-slate-200
                                px-6
                                text-sm
                                font-semibold
                                text-slate-600
                                transition
                                hover:bg-slate-50
                                hover:text-slate-800
                            "
                        >
                            Cancel
                        </button>

                        <div className="sm:min-w-[220px]">

                            <Button
                                type="button"
                                onClick={handleAccept}
                                disabled={!accepted}
                                className="
                                    h-14
                                    text-base
                                "
                            >
                                Accept and Continue
                            </Button>

                        </div>

                    </div>

                </div>

            </div>

        </div>
    );
}