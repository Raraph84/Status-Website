# Status Website

This is my monitoring system, an example is available at https://status.raraph.fr (my uptime is very bad since I can't live 10 mins without modifying my network infrastructure)  
It is composed of 4 parts:

- Website (ReactJS app displaying the last 90 days statistics): https://github.com/Raraph84/Status-Website
- API (NodeJS app serving data for the Website and the Panel): https://github.com/Raraph84/Status-API
- Checker (NodeJS app checking its assigned services): https://github.com/Raraph84/Status-Checker
- Panel (ReactJS app for managing the system): https://github.com/Raraph84/Status-Admin-Panel-Website

## How it works?

The app is composed of 4 resources:

- Services: The actual services that will be checked by the checker if assigned
- Checkers: The servers that are checking its assigned services (cannot be created/edited/removed on the panel at the moment, use the database)
- Pages: The pages that can be viewed with the website
- Groups: Some groups of services that can be assigned to checkers for them to check (cannot be created/edit/removed on the panel at the moment except assigned/unassigning services, use the database)

The services have the current options:

- Type:
  - Website (HTTP(S), must reply with 200 response code)
  - API (HTTP(S), must reply with a valid JSON response)
  - Gateway (WS(S), must be a valid websocket server and must close the connection with a non JSON valid message)
  - Bot (Must be an HTTP(S) endpoint returing an `{ online: boolean; }` JSON response, can be used to monitor a non-exposed app)
  - Minecraft (Minecraft protocol, must reply to a server list ping)
  - Server (ICMP, must reply to at least 1/5 ICMP ping, complete other behavior of other types, see under)
- Name: The actual name of the checker
- Host: The host of the service:
  - An HTTP(S) url for the Website, API or Bot type
  - An WS(S) url for the Gateway type
  - The host of the Minecraft server with or without port for the Minecraft type
  - The FQDN or adirect IPv4/6 for the server type
- Protocol: Only used for server type:
  - 4 to force IPv4
  - 6 to force IPv6
  - 0 to to use IPv6 with fallback to IPv4 if FQDN does not resolve IPv6
- Alert: 1 to send @everyone when alerting the Discord webhook when a service goes down or up, 0 instead
- Disabled: 1 to save data when checking the service (does not disable the check and alert, only disable saving), 0 instead

The checkers have the following options:

- Name and location: Used to describe the checker at places it should be described
- Description: Unused, only for managing purposes
- Check second: Only for non-server type, set the second of a minute to check the services to avoid useless load of a service while checking from multiple checkers

The pages have the following options:

- Short name: Used to retreive the page from the website as first element of the URL path
- Title: Displayed on the page
- URL: Link on the title of the page
- Logo URL: Logo displayed on the page
- Domain: Default displayed page when loading the root of the Website based on the FQDN, can be null

For all the service types except server, the services are checked at the second configured on the checker, then the data is saved in services_statuses table, and then aggregated in the services_daily_statuses table after 1-2 days, every time the service goes up or down, an event is saved in the services_events table  
This behavior will be migrated to the smokeping saving system later

For the server service type, the service will be pinged every 2s with a 1s timeout, then the data will be saved in the services_smokeping every 5 pings (every 10s so)  
Theses datas will be aggregated multiple times (see Status-Checker/src/smokeping.js file)  
If the service does not reply to the 5 pings, then it will be considered as down, so an alert will be sent on the Discord webhook configured and the website will consider the service as down

A Grafana dashboard can be configured by importing grafana.json file to visualize the smokeping data  
A MySQL data source is required an you may have to change the data source of the dashboard variables and the panel to match your source

## Setup

### Prerequisites

- Have already setup the API
- Git installed to clone the repo
- NodeJS installed to build

### Building

Clone the repo and install the libs by running:

```bash
git clone https://github.com/Raraph84/Status-Website
cd Status-Website/
npm install
```

Edit the `Status-Website/.env` to match your API URL
Then build the website by running:

```bash
npm run build
```

Then serve the static website built in `Status-Website/build/` with any webserver

## TODO

- Use the smokeping system for every types of services and delete the old system
- Add a setting on the public website for choosing checker source
- Ability to create/delete/edit everything on the panel
- Better authentication on the panel
- Custom service requirements to be considered up
- Custom alert system with multiple alert channels (SMS/phone, Whatsapp or other)
- Create Docker images for the API and the Checker
- Use prettier on every repo
- Migrate everything to Typescript
- Maybe migrate to NextJS?
