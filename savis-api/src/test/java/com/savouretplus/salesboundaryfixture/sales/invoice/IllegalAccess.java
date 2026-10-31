package com.savouretplus.salesboundaryfixture.sales.invoice;

import com.savouretplus.salesboundaryfixture.sales.order.api.PublicOrderApi;
import com.savouretplus.salesboundaryfixture.sales.order.internal.InternalEntity;
import com.savouretplus.salesboundaryfixture.sales.order.internal.InternalRepository;

/** Deliberate violations: the production verification must reject this pattern. */
public record IllegalAccess(PublicOrderApi api, InternalEntity entity, InternalRepository repository) {}
