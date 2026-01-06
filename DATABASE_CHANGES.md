# Database Changes Required

## Users Collection

Add the following attribute to the **users** collection in Appwrite:

| Attribute  | Type   | Size | Required | Default |
| ---------- | ------ | ---- | -------- | ------- |
| `pronouns` | String | 30   | No       | null    |

### How to add in Appwrite Console:

1. Go to Databases → Your Database → users collection
2. Click "Create Attribute"
3. Select "String"
4. Set Key: `pronouns`
5. Set Size: `30`
6. Required: No
7. Default: Leave empty
8. Click "Create"

---

_Note: The bookmarks feature uses AsyncStorage locally, no database changes needed._
