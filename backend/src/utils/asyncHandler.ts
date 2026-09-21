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
| Express async controllers are wrapped here so every rejected
| promise is forwarded to the centralized error middleware.
|
| This prevents unhandled promise rejections from reaching the
| process-level handler and accidentally shutting down the server.
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

        Promise.resolve(
            handler(
                req,
                res,
                next
            )
        ).catch(
            next
        );
    };
};