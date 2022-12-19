
0) `npm ci`

1) Update `schema.graphql` 

- remove `immutable`
- Change `id: Bytes` -> `id: ID!` 
- Remove underscores in the field names
- Address: `Bytes` -> `String` (`hex` representation)


2) Regenerate the entities with `make codegen`
3) Regenerate the db migrations from the entities: 
- `rm -rf db/migrations/*.js`
- `make migration`

4) Update the batch logic in `processor.run()`

5) Run with `make process`