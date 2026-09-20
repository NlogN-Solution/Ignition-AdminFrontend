/**
 * The reference a student is given on the public confirmation screen.
 *
 * The public `POST /public/eligibility` response returns
 * `str(assessment.id)[:8].upper()` — the first group of the row's UUID — and
 * nothing else that identifies the submission. It is deliberately not the lead
 * id: an anonymous caller must not be handed the CRM's key.
 *
 * So there is no reference *column* to read; it is derived, and it has to be
 * derived the same way on both sides or the number the student reads out over
 * the phone will not find their row. This is that derivation, in one place.
 * The staff list's search box matches it server-side (see
 * `EligibilityService.list_assessments`).
 */
export const assessmentReference = (id: string) => id.slice(0, 8).toUpperCase();
