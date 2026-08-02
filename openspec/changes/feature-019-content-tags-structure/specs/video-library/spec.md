## ADDED Requirements

### Requirement: Video Tag Compatibility With Shared Content Tags

The video library SHALL treat existing video tags as the proven implementation contract for future shared content tag work.

#### Scenario: Shared tag architecture preserves current video tag behavior

- **WHEN** the project defines shared content tags
- **THEN** existing video create and edit workflows SHALL continue to support selected and typed video tag assignments
- **AND** existing video tag normalization, de-duplication, and passive public badge behavior SHALL remain the compatibility baseline for later shared-tag implementation slices

#### Scenario: Future video tag migration is isolated

- **WHEN** a future feature changes video tag storage from `VideoTag` or `VideosToVideoTags`
- **THEN** that feature SHALL preserve existing video tag assignments
- **AND** it SHALL preserve current public video visibility rules
- **AND** it SHALL include a dedicated migration and rollback boundary for video tag data
