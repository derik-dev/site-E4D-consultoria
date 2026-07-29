<?php
// ─────────────────────────────────────────────
//  SMTP Hostinger — substitua pelos dados reais da caixa criada no hPanel
// ─────────────────────────────────────────────
define('SMTP_HOST',   'smtp.hostinger.com');
define('SMTP_PORT',   465);
define('SMTP_SECURE', 'ssl');
define('SMTP_USER',   'envio@e4dconsultoria.com.br');  // e-mail criado na Hostinger
define('SMTP_PASS',   'Pipoca26""');                   // senha da caixa de e-mail
define('MAIL_TO',     'mateus.albuquerque@e4dconsultoria.com'); // destinatário
// ─────────────────────────────────────────────

header('Content-Type: application/json; charset=utf-8');

// Bloqueia qualquer método que não seja POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Método não permitido.']);
    exit;
}

// Sanitiza e captura campos
function clean(string $val): string {
    return htmlspecialchars(strip_tags(trim($val)), ENT_QUOTES, 'UTF-8');
}

$nome     = clean($_POST['nome']     ?? '');
$email    = clean($_POST['email']    ?? '');
$telefone = clean($_POST['telefone'] ?? '');
$empresa  = clean($_POST['empresa']  ?? '');
$mensagem = clean($_POST['mensagem'] ?? '');

// Validação dos campos obrigatórios
if (empty($nome) || empty($email) || empty($telefone)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'Preencha todos os campos obrigatórios.']);
    exit;
}

if (!filter_var(rawurldecode($email), FILTER_VALIDATE_EMAIL)) {
    http_response_code(422);
    echo json_encode(['success' => false, 'message' => 'E-mail inválido.']);
    exit;
}

// Carrega o PHPMailer (via Composer ou include manual)
$composerAutoload = __DIR__ . '/vendor/autoload.php';
$phpMailerFiles = [
    __DIR__ . '/phpmailer/src/Exception.php',
    __DIR__ . '/phpmailer/src/PHPMailer.php',
    __DIR__ . '/phpmailer/src/SMTP.php',
];

if (file_exists($composerAutoload)) {
    require_once $composerAutoload;
} elseif (count(array_filter($phpMailerFiles, 'file_exists')) === count($phpMailerFiles)) {
    foreach ($phpMailerFiles as $file) {
        require_once $file;
    }
} else {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'PHPMailer não encontrado no servidor.']);
    exit;
}

$mail = new \PHPMailer\PHPMailer\PHPMailer(true);

try {
    // Configuração SMTP
    $mail->isSMTP();
    $mail->Host       = SMTP_HOST;
    $mail->SMTPAuth   = true;
    $mail->Username   = SMTP_USER;
    $mail->Password   = SMTP_PASS;
    $mail->SMTPSecure = SMTP_SECURE;
    $mail->Port       = SMTP_PORT;
    $mail->CharSet    = 'UTF-8';

    // Remetente e destinatário
    $mail->setFrom(SMTP_USER, 'Site E4D Consultoria');
    $mail->addAddress(MAIL_TO);
    $mail->addReplyTo(rawurldecode($email), $nome);

    // Conteúdo
    $mail->isHTML(true);
    $mail->Subject = $empresa ? "Novo contato pelo site E4D - {$empresa}" : 'Novo contato pelo site E4D';
    $mail->Body    = "
    <html><body style='font-family:Arial,sans-serif;color:#222;max-width:600px'>
      <h2 style='color:#0D182E'>Novo contato pelo site E4D Consultoria</h2>
      <table style='width:100%;border-collapse:collapse'>
        <tr><td style='padding:8px 0;border-bottom:1px solid #eee'><strong>Nome</strong></td><td style='padding:8px 0;border-bottom:1px solid #eee'>{$nome}</td></tr>
        <tr><td style='padding:8px 0;border-bottom:1px solid #eee'><strong>E-mail corporativo</strong></td><td style='padding:8px 0;border-bottom:1px solid #eee'>{$email}</td></tr>
        <tr><td style='padding:8px 0;border-bottom:1px solid #eee'><strong>Telefone</strong></td><td style='padding:8px 0;border-bottom:1px solid #eee'>{$telefone}</td></tr>
        <tr><td style='padding:8px 0;border-bottom:1px solid #eee'><strong>Empresa</strong></td><td style='padding:8px 0;border-bottom:1px solid #eee'>{$empresa}</td></tr>
        <tr><td style='padding:8px 12px 8px 0;vertical-align:top'><strong>Mensagem</strong></td><td style='padding:8px 0'>{$mensagem}</td></tr>
      </table>
    </body></html>";

    $mail->send();
    echo json_encode(['success' => true, 'message' => 'Mensagem enviada com sucesso.']);

} catch (\PHPMailer\PHPMailer\Exception $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Erro ao enviar mensagem.']);
}
