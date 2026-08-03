from pathlib import Path

read_service = Path('lib/estudios/biblical-chronology-maps.ts').read_text(encoding='utf-8')
recovery = Path('lib/estudios/biblical-chronology-recovery.ts').read_text(encoding='utf-8')

for name, text in [('lectura', read_service), ('recuperación', recovery)]:
    assert "import 'server-only'" in text, f'{name}: falta server-only'
    assert 'use client' not in text, f'{name}: no puede ser cliente'

assert ".eq('enabled', true)" in read_service
assert ".eq('review_status', 'approved')" in read_service
assert 'createAdminClient' not in read_service
assert 'biblical_timeline_events' in read_service
assert 'biblical_timeline_event_places' in read_service
assert 'packageVersion' in read_service

assert 'createAdminClient' in recovery
assert 'BIBLICAL_DATA_ADMIN_USER_IDS' in recovery
assert "confirmation: 'RECOVER_ROME_PILOT_V1'" in recovery
assert "dryRun = request.dryRun !== false" in recovery
assert ".eq('review_status', 'pending')" in recovery
assert ".eq('enabled', false)" in recovery
assert "'biblical_timeline_event_places',\n    'biblical_timeline_events',\n    'biblical_timeline_periods',\n    'biblical_places'" in recovery
assert 'use server' not in recovery

print('Contrato server-only de cronologías, mapas y recuperación: OK')
