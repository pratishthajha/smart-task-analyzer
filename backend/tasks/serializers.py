from rest_framework import serializers

class TaskInputSerializer(serializers.Serializer):
    task_id = serializers.CharField(max_length=100)
    title = serializers.CharField(max_length=255)
    due_date = serializers.DateField()
    estimated_hours = serializers.FloatField(min_value=0.1)
    importance = serializers.IntegerField(min_value=1, max_value=10)
    dependencies = serializers.ListField(
        child=serializers.CharField(),
        required=False,
        default=list
    )

class TaskOutputSerializer(serializers.Serializer):
    task_id = serializers.CharField()
    title = serializers.CharField()
    due_date = serializers.DateField()
    estimated_hours = serializers.FloatField()
    importance = serializers.IntegerField()
    dependencies = serializers.ListField()
    priority_score = serializers.FloatField()
    explanation = serializers.CharField()
