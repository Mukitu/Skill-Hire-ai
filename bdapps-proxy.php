<?php
// Save this as bdapps-proxy.php on your whitelisted server (http://103.150.19.134/)
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");

$input = json_decode(file_get_contents('php://input'), true);
if (isset($input['targetUrl']) && isset($input['payload'])) {
    $ch = curl_init($input['targetUrl']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($input['payload']));
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json;charset=utf-8',
        'Accept: application/json',
        'User-Agent: BDApps-SDK/1.2'
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo $response;
} else {
    http_response_code(400);
    echo json_encode(["status" => "FAILED", "message" => "Invalid request"]);
}
?>
