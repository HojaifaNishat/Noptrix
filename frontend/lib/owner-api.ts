const API_BASE =
    process.env.NEXT_PUBLIC_API_URL ??
    "http://localhost:5000/api";

export const getOwnerToken = () =>
    typeof window === "undefined"
        ? null
        : window.localStorage.getItem(
              "noptrix_owner_access_token"
          );

export const getOwnerSessionId = () =>
    typeof window === "undefined"
        ? null
        : window.localStorage.getItem(
              "noptrix_owner_session_id"
          );

export const ownerRequest = async <T>(
    path: string,
    options: RequestInit = {}
): Promise<T> => {
    const token = getOwnerToken();
    const response = await fetch(
        `${API_BASE}${path}`,
        {
            ...options,
            headers: {
                "Content-Type": "application/json",
                ...(token
                    ? {
                          Authorization: `Bearer ${token}`,
                      }
                    : {}),
                ...(options.headers ?? {}),
            },
        }
    );

    const responseText = await response.text();
    let body: {
        message?: string;
        data?: T;
    } = {};

    try {
        body = responseText
            ? JSON.parse(responseText)
            : {};
    } catch {
        throw new Error(
            `Backend returned an invalid response (${response.status}).`
        );
    }

    if (!response.ok) {
        throw new Error(
            body.message ??
                `Request failed (${response.status}).`
        );
    }

    return body.data as T;
};

export const saveOwnerToken = (
    token: string
) => {
    window.localStorage.setItem(
        "noptrix_owner_access_token",
        token
    );
};

export const saveOwnerSessionId = (
    sessionId: string
) => {
    window.localStorage.setItem(
        "noptrix_owner_session_id",
        sessionId
    );
};