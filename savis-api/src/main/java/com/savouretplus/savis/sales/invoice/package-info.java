@org.springframework.modulith.ApplicationModule(
    id = "sales.invoice",
    allowedDependencies = {"sales.order::order", "common::pdf"})
package com.savouretplus.savis.sales.invoice;
