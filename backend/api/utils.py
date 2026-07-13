import logging
from rest_framework.response import Response
from rest_framework.views import exception_handler

logger = logging.getLogger('api')

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        logger.error(f'API Error: {exc}')
        return Response({'success': False, 'message': str(exc), 'errors': response.data if hasattr(response, 'data') else {}}, status=response.status_code)
    logger.exception(f'Unhandled exception: {exc}')
    return Response({'success': False, 'message': 'Internal server error', 'errors': {}}, status=500)

def success_response(data=None, message='Success', status_code=200):
    return Response({'success': True, 'message': message, 'data': data}, status=status_code)

def error_response(message='Error', errors=None, status_code=400):
    return Response({'success': False, 'message': message, 'errors': errors or {}}, status=status_code)