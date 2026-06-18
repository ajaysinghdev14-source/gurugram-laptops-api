# Auth routes — cURL and Postman

Base URL: `http://localhost:8000` (or your `PORT` from `.env`).

---

## 1. Register

**POST** `/api/auth/register`

```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","name":"Test User"}' \
  -c cookies.txt \
  -v
```

- **Success (201):** `data.user`, `data.accessToken`, `data.expiresIn`; `Set-Cookie: refreshToken=...`
- **400:** Invalid body (e.g. invalid email, short password, missing name)
- **409:** Email already registered

---

## 2. Login

**POST** `/api/auth/login`

```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}' \
  -c cookies.txt \
  -v
```

- **Success (200):** `data.user`, `data.accessToken`, `data.expiresIn`; `Set-Cookie: refreshToken=...`
- **400:** Invalid body
- **401:** Invalid email or password

---

## 3. Me (current user)

**GET** `/api/auth/me`

```bash
# Use accessToken from register/login response
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -v
```

- **Success (200):** `data.user`
- **401:** Missing or invalid/expired token

---

## 4. Refresh token

**POST** `/api/auth/refresh`

With cookie (from register/login):

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -b cookies.txt \
  -c cookies.txt \
  -v
```

With body (if not using cookies):

```bash
curl -X POST http://localhost:8000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"YOUR_REFRESH_TOKEN"}' \
  -v
```

- **Success (200):** `data.user`, `data.accessToken`, `data.expiresIn`; new `Set-Cookie: refreshToken=...`
- **401:** No refresh token or invalid/expired refresh token

---

## 5. Logout

**POST** `/api/auth/logout`

```bash
curl -X POST http://localhost:8000/api/auth/logout \
  -b cookies.txt \
  -v
```

- **Success (200):** `message: "Logged out"`; cookie cleared

---

## Postman

1. **Environment:** set `baseUrl` = `http://localhost:8000`.
2. **Register:** POST `{{baseUrl}}/api/auth/register`, body raw JSON: `{"email":"...","password":"password123","name":"..."}`. Save `data.accessToken` and ensure cookies are stored (Postman stores them by default).
3. **Login:** POST `{{baseUrl}}/api/auth/login`, body: `{"email":"...","password":"..."}`.
4. **Me:** GET `{{baseUrl}}/api/auth/me`, header: `Authorization: Bearer {{accessToken}}` (or use the token from the login/register response).
5. **Refresh:** POST `{{baseUrl}}/api/auth/refresh` (no body; cookie sent automatically), or send body `{"refreshToken":"..."}` if not using cookies.
6. **Logout:** POST `{{baseUrl}}/api/auth/logout` (cookie sent automatically).

---

## Full flow (cURL)

```bash
# 1. Register
curl -s -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test"}' \
  -c c.txt | jq .

# 2. Copy accessToken from response, then:
export TOKEN="<paste_access_token>"
curl -s -X GET http://localhost:8000/api/auth/me -H "Authorization: Bearer $TOKEN" | jq .

# 3. Refresh (uses cookie from c.txt)
curl -s -X POST http://localhost:8000/api/auth/refresh -b c.txt -c c.txt | jq .

# 4. Logout
curl -s -X POST http://localhost:8000/api/auth/logout -b c.txt | jq .
```
