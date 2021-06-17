# graphql-schema-registry

<img src="https://user-images.githubusercontent.com/445122/95125574-d7466580-075d-11eb-8a78-b6adf34ad811.png" width=100 height=100 align="right"/>

Graphql schema storage as dockerized on-premise service for federated graphql gateway server
(based on [apollo server](https://www.apollographql.com/docs/apollo-server/federation/introduction/)) as alternative to [Apollo studio](https://studio.apollographql.com/)

![](https://img.shields.io/travis/pipedrive/graphql-schema-registry/master?logo=travis)
![](https://img.shields.io/github/v/release/pipedrive/graphql-schema-registry?sort=semver)
![](https://img.shields.io/coveralls/github/pipedrive/graphql-schema-registry/master?logo=coveralls)

## Features

- Stores versioned schema for graphql-federated services
- Serves schema for graphql gateway based on provided services & their versions
- Validates new schema to be compatible with other _running_ services
- Provides UI for developers to see stored schema & its history diff
- Stores & shows in UI persisted queries passed by the gateway for debugging

<img width="1309" alt="Screenshot 2020-08-31 at 15 40 43" src="https://user-images.githubusercontent.com/445122/91720806-65985c00-eba0-11ea-8763-986b9f3f166b.png">

## Roadmap
(Pull requests are encouraged on these topics)
- client tracking (for breaking changes)
- schema usage tracking (for breaking changes)
- separate ephemeral automatic PQs, registered by frontend (use cache only with TTL) from true PQs backend-registered persisted queries (use DB only)
- async schema registration of new schema with events to avoid polling. `schema-registry -> kafka -> gateway`

## Installation

Assuming you have [nvm](https://github.com/nvm-sh/nvm) & [docker](https://www.docker.com/) installed:

```
nvm use
npm install
npm run build
docker-compose up --build
```

Open http://localhost:6001

## Configuration

We rely on docker network and uses hostnames from `docker-compose.yml`.
Check `app/config.js` to see credentials that node service uses to connect to mysql & redis and change it if you install it with own setup. If you use dynamic service discovery (consul/etcd), edit `diplomat.js`

The following are the different environment variables that are looked up that allow configuring the schema registry in different ways.

|Variable Name          | Description                                                               | Default
|-----------------------|---------------------------------------------------------------------------|------|
| DB_HOST               | Host name of the MySQL server                                             | gql-schema-registry-db |
| DB_USERNAME           | Username to connect to MySQL                                              | root |
| DB_SECRET             | Password used to connect to MySQL                                         | root |
| DB_PORT               | Port used when connecting to MySQL                                        | 3306 |
| DB_NAME               | Name of the MySQL database to connect to                                  | schema-registry |
| DB_EXECUTE_MIGRATIONS | Controls whether DB migrations are executed upon registry startup or not  | true |
| REDIS_HOST            | Host name of the Redis server                                             | gql-schema-registry-redis |
| REDIS_PORT            | Port used when connecting to Redis                                        | 6379 |
| REDIS_SECRET          | Password used to connect to Redis                                         | Empty |
| ASSETS_URL            | Controls the url that web assets are served from                          | localhost:6001 |
| NODE_ENV              | Specifies the environment. Use *production* for production like deployment| Empty |

**Note** about `NODE_ENV`: setting the `NODE_ENV` environment variable to *production* will tell the registry
to serve web assets (js, css) from their compiled versions in the `dist/assets` directory.


## Use cases

### Validating schema on deploy

On pre-commit / deploy make a POST /schema/validate to see if its compatible with current schema.

### Schema registration

On service start-up (runtime), make POST to /schema/push to register schema (see API reference for details).
Make sure to handle failure.

## Architecture

### Tech stack

|Frontend (`/client` folder)| Backend (`/app` folder)
|------|------|
|react|nodejs 14|
|apollo client|express, hapi/joi|
|styled-components|apollo-server-express, dataloader|
||redis 6|
||knex|
||mysql 8|

### Components

graphql-schema-registry service is one of the components for graphql federation, but it needs tight
integration with gateway. Check out [examples folder](examples/README.md) on how to implement it. Note however, that
gateway is very simplified and does not have proper error handling, cost limits or fail-safe mechanisms.

In gateway, you may also find useful our [graphql-query-cost](https://github.com/pipedrive/graphql-query-cost) library too. Check it out

![](https://app.lucidchart.com/publicSegments/view/7cd430fc-05b7-4c9e-8dc4-15080da125c6/image.png?v=2)

### DB structure

Migrations are done using knex
![](https://app.lucidchart.com/publicSegments/view/74fc86d4-671e-4644-a198-41d7ff681cae/image.png)

## Development

### DB migrations

To create new DB migration, use:

```bash
npm run new-db-migration
```

If not using the default configuration of executing DB migrations on service startup, you can run the following `npm`
command prior to starting the registry:

```bash
npm run migrate-db
```

The command can be prefixed with any environment variable necessary to configure DB connection (in case you ALTER DB with another user), such as:

```bash
DB_HOST=my-db-host DB_PORT=6000 npm run migrate-db
```

### Contribution

- Before making PR, make sure to run `npm run version` & fill [CHANGELOG](CHANGELOG.md)
- Ping [@tot-ra](https://github.com/tot-ra) if PR is stuck

#### Honorable mentions

Original internal mission that resulted in this project consisted of (in alphabetical order):

- [aleksandergasna](https://github.com/aleksandergasna)
- [ErikSchults](https://github.com/ErikSchults)
- [LexSwed](https://github.com/LexSwed)
- [tot-ra](https://github.com/tot-ra)

## Rest API documentation

### GET /schema/latest

Simplified version of /schema/compose where latest versions from different services is composed. Needed mostly for debugging

### POST /schema/compose

Lists schema based on passed services & their versions.
Used by graphql gateway to fetch schema based on current containers

#### Request params (optional, raw body)
```json
{
  "services": [
    {"name": "service_a", "version": "ke9j34fuuei"},
    {"name": "service_b", "version": "e302fj38fj3"},
  ]
}
```

#### Response example
- ✅ 200
```json
{
    "success": true,
    "data": [
        {
            "id": 2,
            "service_id": 3,
            "version": "ke9j34fuuei",
            "name": "service_a",
            "added_time": "2020-12-11T11:59:40.000Z",
            "type_defs": "\n\ttype Query {\n\t\thello: String\n\t}\n",
            "is_active": 1
        },
        {
            "id": 3,
            "service_id": 4,
            "version": "v1",
            "name": "service_b",
            "added_time": "2020-12-14T18:51:04.000Z",
            "type_defs": "type Query {\n  world: String\n}\n",
            "is_active": 1
        }
    ]
}
```
- ❌ 400 "services[0].version" must be a string
- ❌ 500 Internal error (DB is down)

#### Request params

- services{ name, version}

If `services` is not passed, schema-registry tries to find most recent versions. Logic behind the scenes is that schema with _highest_ `added_time` OR `updated_time` is picked as latest. If time is the same, `schema.id` is used.

### POST /schema/push

Validates and registers new schema for a service.

#### Request params (optional, raw body)

```json
{
  "name": "service_a",
  "version": "ke9j34fuuei",
  "type_defs": "\n\ttype Query {\n\t\thello: String\n\t}\n"
}
```

#### POST /schema/validate

Validates schema, without adding to DB

##### Request params (raw body)

- name
- version
- type_defs

#### POST /schema/diff

Compares schemas and finds breaking or dangerous changes between provided and latest schemas.

- name
- version
- type_defs

#### DELETE /schema/delete/:schemaId

Deletes specified schema

##### Request params

| Property                  | Type    | Comments                            |
| ------------------------- | ------- | ----------------------------------- |
| `schemaId`                | number  | ID of sechema                       |

#### DELETE /service/delete/:name

Deletes specified service including all schemas registered for that service

##### Request params

| Property                  | Type    | Comments                            |
| ------------------------- | ------- | ----------------------------------- |
| `name`                    | string  | name of service                     |


#### GET /persisted_query

Looks up persisted query from DB & caches it in redis if its found

##### Request params (query)


| Property                  | Type    | Comments                            |
| ------------------------- | ------- | ----------------------------------- |
| `key`                | string  | hash of APQ (with `apq:` prefix)                       |

#### POST /persisted_query

Adds persisted query to DB & redis cache

##### Request params (raw body)


| Property                  | Type    | Comments                            |
| ------------------------- | ------- | ----------------------------------- |
| `key`                | string  | hash of APQ (with `apq:` prefix)                       |
| `value`                | string  | Graphql query                       |
