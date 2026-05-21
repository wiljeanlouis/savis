package com.savouretplus.savis.bom.port;

import com.savouretplus.savis.bom.domain.ComponentNeededEvent;

public interface ComponentNeededEventPort {
    void publish(ComponentNeededEvent componentNeededEvent);

}
