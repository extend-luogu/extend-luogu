import Schema from 'schemastery'

export default Schema.object({
    accentColor: Schema.string()
        .default('blueviolet')
        .description('exlg 着重色')
})
