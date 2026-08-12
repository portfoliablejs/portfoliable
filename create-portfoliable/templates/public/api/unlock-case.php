<?php
// File: templates/public/api/unlock-case.php
// Purpose: Validate per-case passwords server-side for PHP-compatible self-hosting.

declare(strict_types=1);

header('Content-Type: application/json');
header('Cache-Control: no-store');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'method-not-allowed']);
    exit;
}

$rawBody = file_get_contents('php://input');
$payload = json_decode($rawBody ?: '{}', true);

if (!is_array($payload)) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid-json']);
    exit;
}

$caseId = trim((string)($payload['caseId'] ?? ''));
$password = (string)($payload['password'] ?? '');

if ($caseId === '' || $password === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'missing-input']);
    exit;
}

$configPath = __DIR__ . '/password.config.json';
if (!is_file($configPath)) {
    http_response_code(401);
    echo json_encode(['ok' => false]);
    exit;
}

$configRaw = file_get_contents($configPath);
$config = json_decode($configRaw ?: '{}', true);
$record = is_array($config) && isset($config['cases'][$caseId]) && is_array($config['cases'][$caseId])
    ? $config['cases'][$caseId]
    : null;
$storedHash = is_array($record) ? (string)($record['hash'] ?? '') : '';

if ($storedHash === '') {
    http_response_code(401);
    echo json_encode(['ok' => false]);
    exit;
}

$ok = password_verify($password, $storedHash);
http_response_code($ok ? 200 : 401);
echo json_encode(['ok' => $ok]);
