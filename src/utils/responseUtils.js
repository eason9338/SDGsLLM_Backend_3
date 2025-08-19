/**
 * 統一 API 回應格式工具
 */

class ApiResponse {
  static success(res, data = null, message = '操作成功', statusCode = 200) {
    return res.status(statusCode).json({
      success: true,
      message,
      data,
      timestamp: new Date().toISOString()
    });
  }

  static error(res, message = '操作失敗', statusCode = 500, errors = null) {
    return res.status(statusCode).json({
      success: false,
      message,
      errors,
      timestamp: new Date().toISOString()
    });
  }

  static created(res, data, message = '創建成功') {
    return this.success(res, data, message, 201);
  }

  static notFound(res, message = '資源不存在') {
    return this.error(res, message, 404);
  }

  static unauthorized(res, message = '未授權') {
    return this.error(res, message, 401);
  }

  static badRequest(res, message = '請求無效', errors = null) {
    return this.error(res, message, 400, errors);
  }

  static serverError(res, message = '伺服器錯誤', error = null) {
    const errors = error ? { details: error.message } : null;
    return this.error(res, message, 500, errors);
  }
}

module.exports = ApiResponse;