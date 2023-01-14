rm db/migrations/*
npx squid-typeorm-codegen 
make build
make up
npx squid-typeorm-migration generate
git add .
git commit -m "$1"
git push 
sqd squid release "new-one@v$1"
