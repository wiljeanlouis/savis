# SAVIS

## Purpose and functionalities
**SAVIS** is the information system for **SavouretPlus** which will be used to:

* manage the **product catalog**
* allow customers to **place orders**
* calculate the **price of orders**
* manage **recipes and the cost of dishes**
* support the **catering and decoration services**

The system will also serve as the basis for other future functionalities:

* inventory management
* automatic cost calculation
* margin analysis
* order automation.


## Architecture
**SAVIS** has a client-server architecture. It is separated in the following modules :
* [SAVIS API](savis-api/README.md): the server that exposes all the endpoints
* [SAVIS Admin](savis-admin/README.md): the client that offers the UI needed by admin users to manage SAVIS