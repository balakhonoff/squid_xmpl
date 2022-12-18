module.exports = class Data1671396194672 {
    name = 'Data1671396194672'

    async up(db) {
        await db.query(`CREATE TABLE "gravatar" ("id" character varying NOT NULL, "owner" bytea NOT NULL, CONSTRAINT "PK_e887b4dffafd686933930ef25bb" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "gravatar"`)
    }
}
