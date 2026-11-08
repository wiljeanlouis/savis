/** Owns order snapshots, lifecycle and production requirements; exposes conversion and invoicing contracts. */
@org.springframework.modulith.ApplicationModule(
    id = "sales.order",
    allowedDependencies = {"catalog::catalog", "bom::bom", "supply::supply", "common"})
package com.savouretplus.savis.sales.order;
