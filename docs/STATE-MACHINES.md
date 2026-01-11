# State Machine Diagrams

This document contains state machine diagrams for the stateful components in the peabod-web project.

## Table of Contents

1. [Header Component](#header-component)
2. [Footer Component](#footer-component)
3. [LoginModal Component](#loginmodal-component)
4. [RegisterModal Component](#registermodal-component)
5. [MediaMetadataEditor Component](#mediametadataeditor-component)
6. [Editor Component](#editor-component)
7. [MediaLibraryPage Component](#medialibrarypage-component)
8. [UsersPage Component](#userspage-component)
9. [ThemeProvider Component](#themeprovider-component)

---

## Header Component

The Header manages navigation and user authentication via a hamburger menu.

```mermaid
stateDiagram-v2
    [*] --> Loading: Component Mount
    Loading --> LoggedOut: No User Found
    Loading --> LoggedIn: User Found

    state "Menu Closed" as MenuClosed
    state "Menu Open" as MenuOpen

    LoggedOut --> MenuClosed
    LoggedIn --> MenuClosed

    MenuClosed --> MenuOpen: Click Hamburger
    MenuOpen --> MenuClosed: Click Outside
    MenuOpen --> MenuClosed: Click Hamburger

    MenuOpen --> ShowLoginModal: Click Sign In
    MenuOpen --> ShowRegisterModal: Click Create Account

    ShowLoginModal --> LoggedIn: Login Success
    ShowLoginModal --> MenuClosed: Close Modal
    ShowLoginModal --> ShowRegisterModal: Switch to Register

    ShowRegisterModal --> LoggedIn: Register Success
    ShowRegisterModal --> MenuClosed: Close Modal
    ShowRegisterModal --> ShowLoginModal: Switch to Login

    MenuOpen --> LoggedOut: Logout

    LoggedIn --> [*]: Unmount
    LoggedOut --> [*]: Unmount
```

---

## Footer Component

The Footer displays copyright info and provides theme selection via a dropdown picker.

```mermaid
stateDiagram-v2
    [*] --> PickerClosed: Component Mount

    state "Picker Closed" as PickerClosed
    state "Picker Open" as PickerOpen

    PickerClosed --> PickerOpen: Click Theme Chip
    PickerOpen --> PickerClosed: Click Outside
    PickerOpen --> PickerClosed: Click Theme Chip

    PickerOpen --> ThemeChange: Select Theme
    ThemeChange --> PickerClosed: Theme Applied + Close Picker
```

---

## LoginModal Component

Handles the login form submission flow.

```mermaid
stateDiagram-v2
    [*] --> Idle: Modal Opens

    Idle --> Typing: User Input
    Typing --> Typing: Continue Typing
    Typing --> Submitting: Submit Form

    Submitting --> Success: 200 Response
    Submitting --> Error: Error Response

    Error --> Typing: User Corrects Input
    Error --> Submitting: Retry Submit

    Success --> [*]: Close Modal + onSuccess()

    state Idle {
        email = ""
        password = ""
        error = ""
        loading = false
    }

    state Submitting {
        loading = true
    }

    state Error {
        loading = false
        error = "message"
    }
```

---

## RegisterModal Component

Handles the registration form submission flow.

```mermaid
stateDiagram-v2
    [*] --> Idle: Modal Opens

    Idle --> Typing: User Input
    Typing --> Typing: Continue Typing
    Typing --> Submitting: Submit Form

    Submitting --> Success: 200 Response
    Submitting --> Error: Error Response

    Error --> Typing: User Corrects Input

    Success --> [*]: Close Modal + onSuccess()

    note right of Submitting
        POST /api/auth/register
        {name, email, password}
    end note
```

---

## MediaMetadataEditor Component

Complex component for uploading and editing media metadata.

```mermaid
stateDiagram-v2
    [*] --> NoMedia: mediaId = null
    [*] --> LoadingMedia: mediaId provided

    NoMedia --> Uploading: File Selected
    Uploading --> MediaLoaded: Upload Success
    Uploading --> NoMedia: Upload Error

    LoadingMedia --> MediaLoaded: Fetch Success
    LoadingMedia --> NoMedia: Fetch Error

    state MediaLoaded {
        [*] --> Collapsed
        Collapsed --> Expanded: Click Header
        Expanded --> Collapsed: Click Header

        Expanded --> EditingMetadata: Change Field
        EditingMetadata --> Saving: Click Save
        Saving --> Expanded: Save Success
        Saving --> EditingMetadata: Save Error

        Expanded --> Uploading: Replace File
    }

    MediaLoaded --> NoMedia: Remove Media

    note right of Uploading
        POST /admin/api/upload
    end note

    note right of Saving
        PUT /admin/api/media/:id
    end note
```

### MediaMetadataEditor State Variables

```mermaid
stateDiagram-v2
    direction LR

    state "State Variables" as vars {
        media: Media_or_null
        expanded: boolean
        loading: boolean
        uploading: boolean
        saving: boolean
        error: string_or_null
        editForm: FormData
    }
```

---

## Editor Component

Generic form editor for articles and pages.

```mermaid
stateDiagram-v2
    [*] --> Ready: Component Mount

    Ready --> Editing: Field Change
    Editing --> Editing: More Changes

    state "Image Field" as ImageField {
        [*] --> NoImage
        NoImage --> ImageUploading: Select File
        ImageUploading --> HasImage: Upload Success
        ImageUploading --> NoImage: Upload Error
        HasImage --> NoImage: Remove Image
        HasImage --> ImageUploading: Replace Image
    }

    Editing --> Submitting: Form Submit
    Ready --> Submitting: Form Submit

    Submitting --> Success: API Success
    Submitting --> Error: API Error

    Error --> Editing: User Fixes
    Success --> [*]: Redirect to List

    note right of Submitting
        POST or PUT to apiEndpoint
    end note
```

---

## MediaLibraryPage Component

Complex page with filtering, pagination, and CRUD operations.

```mermaid
stateDiagram-v2
    [*] --> Loading: Component Mount

    Loading --> Loaded: Fetch Success
    Loading --> Error: Fetch Error

    state Loaded {
        [*] --> GridView
        GridView --> TableView: Toggle View
        TableView --> GridView: Toggle View

        GridView --> Filtering: Change Filter
        TableView --> Filtering: Change Filter
        Filtering --> GridView: Refetch Complete
        Filtering --> TableView: Refetch Complete
    }

    Loaded --> Uploading: File Selected
    Uploading --> Loading: Upload Complete

    Loaded --> EditModal: Click Edit
    EditModal --> Saving: Save Changes
    Saving --> Loaded: Save Success
    EditModal --> Loaded: Cancel

    Loaded --> DeleteConfirm: Click Delete
    DeleteConfirm --> Deleting: Confirm
    DeleteConfirm --> Loaded: Cancel
    Deleting --> Loading: Delete Success

    Loaded --> UsageModal: Show Usage
    UsageModal --> Loaded: Close
```

### MediaLibraryPage Filter State

```mermaid
stateDiagram-v2
    direction LR

    state "Filter States" as Filters {
        typeFilter: all_image_video
        usageFilter: all_in_use_orphaned
        sortOrder: desc_asc
        search: string
        page: number
        viewMode: grid_table
    }

    state "Any Filter Change" as change

    Filters --> change: User Action
    change --> Filters: page = 0, refetch()
```

---

## UsersPage Component

Admin page for user management with role and status controls.

```mermaid
stateDiagram-v2
    [*] --> Loading: Component Mount

    Loading --> UserList: Fetch Success

    state UserList {
        [*] --> Browsing

        Browsing --> Filtered: Change Status Filter
        Filtered --> Browsing: Clear Filter

        Browsing --> Searching: Enter Search
        Searching --> Browsing: Clear Search
    }

    UserList --> EditModal: Click Edit User
    EditModal --> Saving: Save Changes
    Saving --> UserList: Success (Refetch)
    EditModal --> UserList: Cancel

    UserList --> Approving: Click Approve
    Approving --> UserList: Success (Refetch)

    UserList --> ConfirmReject: Click Reject
    ConfirmReject --> Rejecting: Confirm
    ConfirmReject --> UserList: Cancel
    Rejecting --> UserList: Success (Refetch)

    UserList --> ConfirmRevoke: Click Revoke
    ConfirmRevoke --> Revoking: Confirm
    Revoking --> UserList: Success (Refetch)

    UserList --> ConfirmToggle: Toggle Active
    ConfirmToggle --> Toggling: Confirm
    Toggling --> UserList: Success (Refetch)

    UserList --> ChangingRole: Change Role
    ChangingRole --> UserList: Success (Refetch)
```

### User Status Flow

```mermaid
stateDiagram-v2
    [*] --> Pending: User Registers

    Pending --> Approved: Admin Approves
    Pending --> [*]: Admin Rejects (Delete)

    Approved --> Inactive: Admin Deactivates
    Approved --> Pending: Admin Revokes

    Inactive --> Approved: Admin Activates

    note right of Approved
        User can log in
        and access the system
    end note

    note right of Pending
        User cannot log in
        until approved
    end note
```

---

## ThemeProvider Component

Context provider for theme management with localStorage persistence.

```mermaid
stateDiagram-v2
    [*] --> Hydrating: Component Mount (SSR)

    Hydrating --> CheckStorage: mounted = true

    CheckStorage --> DefaultTheme: No saved theme
    CheckStorage --> SavedTheme: Theme in localStorage

    DefaultTheme --> Active: Apply CSS Variables
    SavedTheme --> Active: Apply CSS Variables

    Active --> Changing: setTheme() called
    Changing --> Active: Apply new CSS + Save to localStorage

    note right of Hydrating
        mounted = false
        Prevents hydration mismatch
    end note

    note right of Active
        Theme object available
        via useTheme() hook
    end note
```

---

## Component Interaction Overview

High-level view of how stateful components interact.

```mermaid
flowchart TB
    subgraph "Global State"
        ThemeProvider[ThemeProvider\nContext]
        AuthState[Auth State\nHeader]
    end

    subgraph "Layout Components"
        Header[Header]
        Footer[Footer]
    end

    subgraph "Admin Pages"
        MediaPage[MediaLibraryPage]
        UsersPage[UsersPage]
        ArticlesPage[ArticlesPage]
        TagsPage[TagsPage]
    end

    subgraph "Shared Components"
        Editor[Editor]
        MediaMetadataEditor[MediaMetadataEditor]
        DataTable[DataTable]
        MediaCard[MediaCard]
    end

    subgraph "API Layer"
        AuthAPI["/api/auth/*"]
        MediaAPI["/admin/api/media/*"]
        ArticlesAPI["/admin/api/articles/*"]
        UsersAPI["/admin/api/users/*"]
        TagsAPI["/admin/api/tags/*"]
    end

    ThemeProvider --> Footer
    ThemeProvider --> MediaPage
    ThemeProvider --> UsersPage
    AuthState --> Header
    Header --> AuthAPI

    MediaPage --> MediaCard
    MediaPage --> MediaMetadataEditor
    MediaPage --> MediaAPI

    ArticlesPage --> Editor
    ArticlesPage --> DataTable
    ArticlesPage --> ArticlesAPI

    Editor --> MediaMetadataEditor
    Editor --> MediaAPI

    UsersPage --> UsersAPI
    TagsPage --> TagsAPI
```

---

## State Management Patterns Summary

| Pattern | Components Using It | Description |
|---------|---------------------|-------------|
| **Loading State** | All pages | `loading` boolean for async operations |
| **Error State** | Editor, MediaMetadataEditor, MediaLibraryPage | `error: string \| null` |
| **Modal State** | AuthMenu, MediaLibraryPage, UsersPage | Boolean flags for showing/hiding modals |
| **Form State** | Editor, MediaMetadataEditor, TagsPage | Object or multiple states for form fields |
| **Filter State** | MediaLibraryPage, UsersPage | Multiple states for filtering/sorting |
| **Pagination State** | MediaLibraryPage | `page` number with total count |
| **Context State** | ThemeProvider | React Context for global state |
| **Optimistic Refetch** | All admin pages | Refetch list after mutations |
