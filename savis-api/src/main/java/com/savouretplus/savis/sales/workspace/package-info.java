/** Read-only sales workspace that composes quotation, order and invoice branches without owning them. */
@org.springframework.modulith.ApplicationModule(allowedDependencies = {
        "sales.quotation::workspace",
        "sales.order::workspace",
        "sales.invoice::workspace"
})
package com.savouretplus.savis.sales.workspace;
