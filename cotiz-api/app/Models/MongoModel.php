<?php

namespace App\Models;

use MongoDB\Laravel\Eloquent\Model as EloquentModel;

abstract class MongoModel extends EloquentModel
{
    use SerializesMongoId;
}
