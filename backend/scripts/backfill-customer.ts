import "dotenv/config";

import {
    startSession,
} from "mongoose";

import {
    connectDatabase,
    disconnectDatabase,
} from "../src/config/database";

import {
    User,
} from "../src/modules/users/user.model";

import {
    Customer,
} from "../src/modules/customers/customer.model";

import {
    createCustomer,
} from "../src/modules/customers/customer.service";


const main = async (): Promise<void> => {

    const email =
        process.argv[2]
            ?.trim()
            .toLowerCase();

    if (!email) {
        throw new Error(
            "Usage: npx tsx scripts/backfill-customer.ts <user-email>"
        );
    }

    await connectDatabase();

    const user =
        await User.findOne({
            email,
        });

    if (!user) {
        throw new Error(
            `User not found: ${email}`
        );
    }

    console.log(
        `User found: ${user._id.toString()}`
    );

    const existingCustomer =
        await Customer.findOne({
            userId: user._id,
        });

    if (existingCustomer) {
        console.log(
            "Customer profile already exists."
        );

        return;
    }

    const session =
        await startSession();

    try {

        await session.withTransaction(
            async () => {

                await createCustomer(
                    {
                        userId:
                            user._id.toString(),
                    },
                    session
                );
            }
        );

        console.log(
            "Customer profile created successfully."
        );

    } finally {

        await session.endSession();
    }
};


main()
    .catch(
        (error: unknown) => {

            console.error(
                "Customer backfill failed:"
            );

            console.error(
                error
            );

            process.exitCode = 1;
        }
    )
    .finally(
        async () => {
            await disconnectDatabase();
        }
    );
