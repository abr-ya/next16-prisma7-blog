## ADDED Requirements

### Requirement: Admin file previews
The admin file manager SHALL allow administrators to preview common tracked file types from `/admin/files` without leaving the page.

#### Scenario: Preview action is available for previewable files
- **WHEN** an administrator views a tracked file whose MIME type is an image, PDF, or text-like type
- **THEN** the file row SHALL expose a preview action
- **AND** activating the action SHALL open an in-page preview dialog for that file

#### Scenario: Image file is previewed
- **WHEN** an administrator previews a tracked image file
- **THEN** the dialog SHALL render the image using the app-owned `/files/{fileId}/download` route
- **AND** the dialog SHALL preserve a download link for the same file

#### Scenario: PDF file is previewed
- **WHEN** an administrator previews a tracked PDF file
- **THEN** the dialog SHALL embed the PDF using the app-owned `/files/{fileId}/download` route
- **AND** the dialog SHALL preserve a download link for the same file

#### Scenario: Text file is previewed
- **WHEN** an administrator previews a tracked text-like file within the preview size limit
- **THEN** the dialog SHALL fetch the file content through the app-owned `/files/{fileId}/download` route
- **AND** it SHALL render the text in a readable, scrollable preview area

#### Scenario: Text file is too large to preview
- **WHEN** an administrator previews a tracked text-like file that exceeds the preview size limit
- **THEN** the dialog SHALL explain that inline preview is unavailable for the file size
- **AND** it SHALL preserve a download link for the same file

#### Scenario: Unsupported file remains downloadable
- **WHEN** an administrator views a tracked file whose MIME type is not previewable
- **THEN** the file row SHALL NOT offer an active inline preview
- **AND** the existing download link SHALL remain available

#### Scenario: Preview does not expose provider URLs
- **WHEN** an administrator previews any supported tracked file
- **THEN** the preview source SHALL use the app-owned `/files/{fileId}/download` route
- **AND** the UI SHALL NOT expose the raw storage provider URL as the preview source
