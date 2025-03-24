from django.shortcuts import render, redirect
from django.contrib.auth.decorators import user_passes_test
from django.http import JsonResponse
from django.contrib.auth.models import User
from django.views.decorators.csrf import csrf_exempt
import json

# Helper function to check if user is admin
def is_admin(user):
    return user.is_authenticated and user.is_staff

# Admin Dashboard View
@user_passes_test(is_admin)
def admin_dashboard(request):
    # Get all news data, not filtered by department
    # You'll need to adjust this to your models
    from .models import Article
    
    # Get sentiment counts from all articles
    positive_count = Article.objects.filter(sentiment='Positive').count()
    negative_count = Article.objects.filter(sentiment='Negative').count()
    neutral_count = Article.objects.filter(sentiment='Neutral').count()
    
    total_count = positive_count + negative_count + neutral_count
    
    # Calculate percentages
    positive_percentage = round((positive_count / total_count) * 100) if total_count > 0 else 0
    negative_percentage = round((negative_count / total_count) * 100) if total_count > 0 else 0
    neutral_percentage = round((neutral_count / total_count) * 100) if total_count > 0 else 0
    
    # Get news channels data
    news_channels = []
    # Add your logic to fetch all channels with their sentiment counts
    
    # Get dates and daily sentiment counts for the line chart
    # This depends on your data structure
    
    context = {
        'positive_percentage': positive_percentage,
        'negative_percentage': negative_percentage,
        'neutral_percentage': neutral_percentage,
        'news_channels': news_channels,
        'is_admin': True,
        # Add other necessary context variables for charts
    }
    
    return render(request, 'dashboard.html', context)

# Admin News Management View
@user_passes_test(is_admin)
def admin_news(request):
    context = {
        'is_admin': True,
    }
    return render(request, 'news.html', context)

# Admin User Management View
@user_passes_test(is_admin)
def admin_users(request):
    users = User.objects.all()
    context = {
        'users': users,
        'is_admin': True,
    }
    return render(request, 'admin_users.html', context)

# API for user management
@csrf_exempt
@user_passes_test(is_admin)
def user_api(request):
    if request.method == 'GET':
        users = list(User.objects.values('id', 'username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active'))
        return JsonResponse({'users': users})
        
    elif request.method == 'POST':
        data = json.loads(request.body)
        # Create a new user
        try:
            user = User.objects.create_user(
                username=data['username'],
                email=data['email'],
                password=data['password'],
                first_name=data.get('first_name', ''),
                last_name=data.get('last_name', ''),
                is_staff=data.get('is_staff', False)
            )
            return JsonResponse({'success': True, 'id': user.id})
        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})
    
    elif request.method == 'PUT':
        data = json.loads(request.body)
        try:
            user = User.objects.get(id=data['id'])
            user.username = data.get('username', user.username)
            user.email = data.get('email', user.email)
            user.first_name = data.get('first_name', user.first_name)
            user.last_name = data.get('last_name', user.last_name)
            user.is_staff = data.get('is_staff', user.is_staff)
            
            if 'password' in data and data['password']:
                user.set_password(data['password'])
                
            user.save()
            return JsonResponse({'success': True})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'})
    
    elif request.method == 'DELETE':
        data = json.loads(request.body)
        try:
            user = User.objects.get(id=data['id'])
            user.delete()
            return JsonResponse({'success': True})
        except User.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'User not found'})