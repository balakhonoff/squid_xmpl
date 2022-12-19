module.exports = class Data1671451698820 {
    name = 'Data1671451698820'

    async up(db) {
        await db.query(`CREATE TABLE "approval" ("id" character varying NOT NULL, "owner" text NOT NULL, "spender" text NOT NULL, "value" numeric NOT NULL, "block_number" numeric NOT NULL, "block_timestamp" numeric NOT NULL, "transaction_hash" text NOT NULL, CONSTRAINT "PK_97bfd1cd9dff3c1302229da6b5c" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "transfer" ("id" character varying NOT NULL, "from" text NOT NULL, "to" text NOT NULL, "value" numeric NOT NULL, "block_number" numeric NOT NULL, "block_timestamp" numeric NOT NULL, "transaction_hash" text NOT NULL, CONSTRAINT "PK_fd9ddbdd49a17afcbe014401295" PRIMARY KEY ("id"))`)
        await db.query(`CREATE TABLE "balance" ("id" character varying NOT NULL, "value" numeric NOT NULL, CONSTRAINT "PK_079dddd31a81672e8143a649ca0" PRIMARY KEY ("id"))`)
    }

    async down(db) {
        await db.query(`DROP TABLE "approval"`)
        await db.query(`DROP TABLE "transfer"`)
        await db.query(`DROP TABLE "balance"`)
    }
}
