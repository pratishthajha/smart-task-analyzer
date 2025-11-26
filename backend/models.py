from django.db import models
from django.utils import timezone

class Task(models.Model):
    task_id = models.CharField(max_length=100, unique=True)
    title = models.CharField(max_length=255)
    due_date = models.DateField()
    estimated_hours = models.FloatField()
    importance = models.IntegerField()  # 1-10 scale
    dependencies = models.JSONField(default=list, blank=True)
    priority_score = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.task_id}: {self.title}"
    
    class Meta:
        ordering = ['-priority_score']
