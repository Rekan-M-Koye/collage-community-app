# Appwrite Database Update Instructions

## Add New Attribute to Users Collection

To enable the academic information cooldown feature, you need to add a new attribute to your existing users collection in Appwrite.

### Steps:

1. **Login to Appwrite Console**

   - Go to your Appwrite dashboard

2. **Navigate to Database**

   - Click on "Databases" in the left sidebar
   - Select your database

3. **Open Users Collection**

   - Find and open the collection with ID: `68fc7b42001bf7efbba3`
   - This is your users collection

4. **Add New Attribute**
   Click on "Attributes" tab, then "Add Attribute", and create:

   - **Attribute Key**: `lastAcademicUpdate`
   - **Type**: `String` (we'll store ISO date strings)
   - **Size**: `50` (enough for ISO datetime)
   - **Required**: `No` (unchecked)
   - **Default Value**: Leave empty
   - **Array**: `No` (unchecked)

5. **Save and Wait for Indexing**
   - Click "Create"
   - Wait for the attribute to be indexed (this may take a few moments)

### Alternative (If you prefer DateTime type):

If Appwrite supports DateTime type in your version:

- **Type**: `DateTime`
- **Required**: `No`
- **Default Value**: Leave empty

## What This Does:

- Stores the timestamp of when the user last updated their academic information (university, college, stage)
- Enables the 30-day cooldown restriction
- Persists across app restarts and device changes

## After Adding the Attribute:

The app will now:

1. ✅ Save `lastAcademicUpdate` timestamp when user changes academic info
2. ✅ Load the timestamp when user logs in
3. ✅ Calculate cooldown period correctly
4. ✅ Display remaining days until next update is allowed
5. ✅ Persist the data in both Appwrite and local AsyncStorage

## Testing:

1. Update your profile's academic information
2. Close and reopen the app
3. Try to edit academic info again - you should see the cooldown message
4. Check your Appwrite console to verify the `lastAcademicUpdate` field is populated

---

**Note**: No need to create a separate settings table. All user-related preferences are stored in the existing users collection.
