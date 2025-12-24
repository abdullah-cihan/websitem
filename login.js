<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Giriş Yap | Admin Paneli</title>

  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" referrerpolicy="no-referrer">
  <link rel="stylesheet" href="style.css">
  <link rel="stylesheet" href="login.css">
</head>

<body class="login-page">
  <div class="login-wrapper">
    <div class="login-card glass">
      <div class="login-header">
        <h2>Admin<span>.</span></h2>
        <p>Yönetim paneline erişmek için giriş yapın.</p>
      </div>

      <form id="login-form" autocomplete="off" novalidate>
        <div class="input-group-login">
          <i class="fa-solid fa-user"></i>
          <input type="text" id="username" name="username" placeholder="Kullanıcı Adı" required autocomplete="username">
        </div>

        <div class="input-group-login">
          <i class="fa-solid fa-lock"></i>
          <input type="password" id="password" name="password" placeholder="Şifre" required autocomplete="current-password">
        </div>

        <button type="submit" class="btn-login">
          Giriş Yap <i class="fa-solid fa-arrow-right"></i>
        </button>

        <p class="forgot-wrap">
          <a href="#" id="forgot-btn" class="forgot-link">Şifremi unuttum</a>
        </p>

        <p id="error-msg" class="login-msg login-msg-error" style="display:none;">
          <i class="fa-solid fa-circle-exclamation"></i> Hatalı kullanıcı adı veya şifre!
        </p>

        <p id="lock-msg" class="login-msg login-msg-warn" style="display:none;">
          <i class="fa-solid fa-lock"></i> Çok fazla deneme yapıldı. Lütfen biraz bekleyin.
        </p>
      </form>
    </div>
  </div>

  <script src="login.js"></script>
</body>
</html>
