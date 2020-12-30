#!/usr/bin/env bash

EMAIL="andy@esc.games"
PASSWORD="!ES.gtknygBk5_J"


curl \
    -H "Content-Type: application/json" \
    -d '{
        "email": "'${EMAIL}'",
        "password": "'${PASSWORD}'"
    }' \
    -X POST \
    "https://admin.pubnub.com/api/me"
