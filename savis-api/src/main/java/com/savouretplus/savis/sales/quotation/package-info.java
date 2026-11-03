@org.springframework.modulith.ApplicationModule(
    id = "sales.quotation",
    allowedDependencies = {"catalog::catalog", "sales.order::order", "common::pdf"})
package com.savouretplus.savis.sales.quotation;
