export interface Tenant {
    authenticationToken: string,
    name: string,
    id: string,
    metadata: object,
    updatedDate: string,
    updatedBy: string,
    deleted: boolean,
    createdBy: string,
    createdDate: string,
    engineState: boolean,
}
