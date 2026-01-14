#!/usr/bin/env python3
"""
音乐播放器后端服务器
提供音乐文件的访问和 API 接口
"""

import os
import json
from pathlib import Path
from http.server import HTTPServer, SimpleHTTPRequestHandler
import urllib.parse

# 配置
MUSIC_DIR = Path(__file__).parent.parent
PLAYER_DIR = Path(__file__).parent
PORT = 8000

class MusicRequestHandler(SimpleHTTPRequestHandler):
    """自定义 HTTP 请求处理器"""
    
    song_counter = 0  # 歌曲计数器，用于生成唯一 ID
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PLAYER_DIR), **kwargs)
    
    def do_GET(self):
        """处理 GET 请求"""
        parsed_path = urllib.parse.urlparse(self.path)
        
        # API 路由
        if parsed_path.path == '/api/music':
            self.handle_music_api()
        elif parsed_path.path.startswith('/music/'):
            self.handle_music_file(parsed_path.path)
        else:
            # 默认处理静态文件
            super().do_GET()
    
    def handle_music_api(self):
        """处理音乐 API 请求"""
        try:
            # 扫描音乐目录
            songs = []
            artists = {}
            
            music_extensions = ['.mp3', '.ogg', '.flac', '.m4a', '.wav']
            
            for artist_dir in MUSIC_DIR.iterdir():
                if not artist_dir.is_dir() or artist_dir.name.startswith('.'):
                    continue
                
                artist_name = artist_dir.name
                artist_count = 0
                
                for music_file in artist_dir.iterdir():
                    if music_file.is_file() and music_file.suffix.lower() in music_extensions:
                        # 解析歌曲信息
                        song_info = self.parse_song_info(music_file, artist_name)
                        if song_info:
                            songs.append(song_info)
                            artist_count += 1
                
                if artist_count > 0:
                    artists[artist_name] = artist_count
            
            # 转换艺术家字典为列表
            artists_list = [
                {'name': name, 'count': count}
                for name, count in sorted(artists.items())
            ]
            
            # 按艺术家排序歌曲
            songs.sort(key=lambda x: (x['artist'], x['title']))
            
            # 返回 JSON 响应
            response = {
                'success': True,
                'songs': songs,
                'artists': artists_list,
                'total': len(songs)
            }
            
            self.send_json_response(response)
            
        except Exception as e:
            print(f"Error handling music API: {e}")
            self.send_error_response(500, str(e))
    
    def parse_song_info(self, music_file, artist_name):
        """解析歌曲信息"""
        try:
            # 递增计数器，生成唯一 ID
            MusicRequestHandler.song_counter += 1
            
            file_name = music_file.stem  # 文件名（不含扩展名）
            
            # 尝试从文件名解析歌曲名
            title = file_name
            
            # 移除常见的艺术家前缀
            if file_name.startswith(f"{artist_name} - "):
                title = file_name.replace(f"{artist_name} - ", "")
            elif f"_{artist_name}_" in file_name:
                # 格式: 歌曲名_艺术家_专辑_比特率
                parts = file_name.split(f"_{artist_name}_")
                title = parts[0]
            elif " - " in file_name:
                # 格式: 歌曲名 - 其他信息
                parts = file_name.split(" - ")
                title = parts[0]
            
            # 移除数字前缀（如 "01 ", "02 ")
            title = title.lstrip('0123456789. ')
            
            # 构建相对路径
            relative_path = f"../{artist_name}/{music_file.name}"
            
            return {
                'id': MusicRequestHandler.song_counter,
                'title': title,
                'artist': artist_name,
                'path': relative_path,
                'format': music_file.suffix[1:].upper(),
                'filename': music_file.name
            }
        except Exception as e:
            print(f"Error parsing song info for {music_file}: {e}")
            return None
    
    def handle_music_file(self, path):
        """处理音乐文件请求"""
        try:
            # 从路径中提取文件名，并解码 URL 编码
            relative_path = path.replace('/music/', '')
            # URL 解码文件名部分
            decoded_path = urllib.parse.unquote(relative_path)
            file_path = MUSIC_DIR / decoded_path
            
            if file_path.exists() and file_path.is_file():
                # 设置正确的 MIME 类型
                content_type = self.get_content_type(file_path.suffix)
                
                # 发送文件
                with open(file_path, 'rb') as f:
                    self.send_response(200)
                    self.send_header('Content-type', content_type)
                    self.send_header('Content-length', os.path.getsize(file_path))
                    self.send_header('Accept-Ranges', 'bytes')
                    # 设置 CORS 头
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(f.read())
            else:
                print(f"File not found: {file_path}")
                self.send_error_response(404, 'File not found')
                
        except Exception as e:
            print(f"Error handling music file: {e}")
            self.send_error_response(500, str(e))
    
    def get_content_type(self, extension):
        """根据文件扩展名获取 MIME 类型"""
        content_types = {
            '.mp3': 'audio/mpeg',
            '.ogg': 'audio/ogg',
            '.flac': 'audio/flac',
            '.m4a': 'audio/mp4',
            '.wav': 'audio/wav'
        }
        return content_types.get(extension.lower(), 'application/octet-stream')
    
    def send_json_response(self, data):
        """发送 JSON 响应"""
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(data, ensure_ascii=False).encode('utf-8'))
    
    def send_error_response(self, code, message):
        """发送错误响应"""
        self.send_response(code)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        error_data = {
            'success': False,
            'error': message
        }
        self.wfile.write(json.dumps(error_data, ensure_ascii=False).encode('utf-8'))
    
    def log_message(self, format, *args):
        """自定义日志格式"""
        print(f"[{self.log_date_time_string()}] {format % args}")


def run_server():
    """启动服务器"""
    server_address = ('', PORT)
    httpd = HTTPServer(server_address, MusicRequestHandler)
    
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║           🎵 音乐播放器服务器已启动 🎵                      ║
║                                                           ║
║           访问地址: http://localhost:{PORT}                ║
║                                                           ║
║           按 Ctrl+C 停止服务器                             ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n\n服务器已停止")
        httpd.shutdown()


if __name__ == '__main__':
    run_server()