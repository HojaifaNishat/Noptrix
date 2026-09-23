# Backend scripts

Run these commands from the `backend` directory.

```bash
OWNER_NAME="Store Owner" \
OWNER_EMAIL="owner@example.com" \
OWNER_PASSWORD="use-a-strong-password" \
OWNER_CODE="OWN-001" \
npm run seed
```

`seed` creates the owner account, employee permissions, and the `admin`/`owner` roles.
Admin and other staff accounts must be created through the application's invitation flow.

Do not commit owner credentials to source control.
