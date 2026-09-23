import { Router } from "express";

import {
    userAuth,
} from "../../middlewares/userAuth.middleware";

import {
    validate,
} from "../../middlewares/validation.middleware";

import {
    createCustomerController,
    getMyCustomerController,
    getCustomerController,
    getCustomerByUserController,
    updateMyCustomerController,
    updateCustomerController,
    updateCustomerStatusController,
    deleteCustomerController,
} from "./customer.controller";

import {
    createCustomerSchema,
    updateCustomerSchema,
    updateCustomerStatusSchema,
    customerIdParamSchema,
} from "./customer.validator";

const router = Router();

/*
|--------------------------------------------------------------------------
| Create Customer
|--------------------------------------------------------------------------
|
| POST /api/customers
|
*/

router.post(
    "/",
    userAuth,
    validate(
        createCustomerSchema,
        "body"
    ),
    createCustomerController
);

/*
|--------------------------------------------------------------------------
| Get My Customer Profile
|--------------------------------------------------------------------------
|
| GET /api/customers/me
|
*/

router.get(
    "/me",
    userAuth,
    getMyCustomerController
);

/*
|--------------------------------------------------------------------------
| Get My Customer By User
|--------------------------------------------------------------------------
|
| GET /api/customers/me/user
|
| Kept separate so the route structure
| remains explicit and future-proof.
|
*/

router.get(
    "/me/user",
    userAuth,
    getCustomerByUserController
);

/*
|--------------------------------------------------------------------------
| Update My Customer Profile
|--------------------------------------------------------------------------
|
| PATCH /api/customers/me
|
*/

router.patch(
    "/me",
    userAuth,
    validate(
        updateCustomerSchema,
        "body"
    ),
    updateMyCustomerController
);

/*
|--------------------------------------------------------------------------
| Get Customer By ID
|--------------------------------------------------------------------------
|
| GET /api/customers/:customerId
|
*/

router.get(
    "/:customerId",
    userAuth,
    validate(
        customerIdParamSchema,
        "params"
    ),
    getCustomerController
);

/*
|--------------------------------------------------------------------------
| Update Customer
|--------------------------------------------------------------------------
|
| PATCH /api/customers/:customerId
|
*/

router.patch(
    "/:customerId",
    userAuth,
    validate(
        customerIdParamSchema,
        "params"
    ),
    validate(
        updateCustomerSchema,
        "body"
    ),
    updateCustomerController
);

/*
|--------------------------------------------------------------------------
| Update Customer Status
|--------------------------------------------------------------------------
|
| PATCH /api/customers/:customerId/status
|
*/

router.patch(
    "/:customerId/status",
    userAuth,
    validate(
        customerIdParamSchema,
        "params"
    ),
    validate(
        updateCustomerStatusSchema,
        "body"
    ),
    updateCustomerStatusController
);

/*
|--------------------------------------------------------------------------
| Delete Customer
|--------------------------------------------------------------------------
|
| DELETE /api/customers/:customerId
|
*/

router.delete(
    "/:customerId",
    userAuth,
    validate(
        customerIdParamSchema,
        "params"
    ),
    deleteCustomerController
);

export default router;