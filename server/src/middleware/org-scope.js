export const scoped = (rows, user) => rows.filter(row => row.organizationId === user.organizationId)
