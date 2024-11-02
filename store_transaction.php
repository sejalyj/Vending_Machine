<?php
// Connect to MySQL database
$servername = "localhost";
$username = "root"; // Default MySQL username for XAMPP
$password = ""; // Default password for MySQL on XAMPP
$dbname = "vending_machine"; // Your database name

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Read input from frontend
$data = json_decode(file_get_contents('php://input'), true);

$cart = $data['cart'];
$totalAmount = $data['totalAmount'];
$remainingBalance = $data['remainingBalance'];

// Prepare items as a string for storage
$items = [];
foreach ($cart as $item) {
    $items[] = $item['name'] . " - ₹" . $item['price'];
}
$itemsStr = implode(", ", $items);

// Insert transaction into database
$sql = "INSERT INTO transactions (total_amount, remaining_balance, items) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("dds", $totalAmount, $remainingBalance, $itemsStr);

if ($stmt->execute()) {
    echo json_encode(["success" => true, "message" => "Transaction stored successfully"]);
} else {
    echo json_encode(["success" => false, "message" => "Failed to store transaction"]);
}

// Close connection
$stmt->close();
$conn->close();
?>
