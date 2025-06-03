

export type IpcSuccess<T> = {
    success: true;
    data: T | null;
}
export type IpcFailure = {
    success: false;
    error: string;
}

export type IpcResponse<T> = IpcSuccess<T> | IpcFailure