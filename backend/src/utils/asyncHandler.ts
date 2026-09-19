import type {
    NextFunction,
    Request,
    RequestHandler,
    Response,
} from "express";

/*
|--------------------------------------------------------------------------
| Async Request Handler
|--------------------------------------------------------------------------
|
| Express 5 already propagates rejected promises to the
| centralized error middleware.
|
| This wrapper is intentionally kept as a project-level
| convention so every asynchronous controller has the same
| explicit structure and remains easy to migrate/test later.
|
*/

export type AsyncRequestHandler<
    P = Record<string, string>,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Record<string, string>
> = (
    req: Request<
        P,
        ResBody,
        ReqBody,
        ReqQuery
    >,
    res: Response<ResBody>,
    next: NextFunction
) => Promise<void>;

/*
|--------------------------------------------------------------------------
| Async Handler Wrapper
|--------------------------------------------------------------------------
*/

export const asyncHandler = <
    P = Record<string, string>,
    ResBody = unknown,
    ReqBody = unknown,
    ReqQuery = Record<string, string>
>(
    handler: AsyncRequestHandler<
        P,
        ResBody,
        ReqBody,
        ReqQuery
    >
): RequestHandler<
    P,
    ResBody,
    ReqBody,
    ReqQuery
> => {
    return (
        req,
        res,
        next
    ): void => {
        void handler(
            req,
            res,
            next
        );
    };
};