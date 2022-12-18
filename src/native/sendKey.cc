#include <windows.h>
#include <winuser.h>
#include <node.h>

void WhoAmI(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    v8::Isolate *isolate = args.GetIsolate();
    auto message = v8::String::NewFromUtf8Literal(isolate, "I'm a Node Hero!");
    args.GetReturnValue().Set(message);
}

void SendKey(const v8::FunctionCallbackInfo<v8::Value> &args, bool isUp)
{
    v8::Isolate *isolate = args.GetIsolate();
    auto context = isolate->GetCurrentContext();

    int argLen = args.Length();
    INPUT *inputs = new INPUT[argLen]{};
    ZeroMemory(inputs, sizeof(inputs));

    for (int i = 0; i < argLen; i++)
    {
        inputs[i].type = INPUT_KEYBOARD;
        inputs[i].ki.wVk = args[i]->Uint32Value(context).ToChecked();
        if (isUp)
            inputs[i].ki.dwFlags = KEYEVENTF_KEYUP;
    }

    UINT uSent = SendInput(argLen, inputs, sizeof(INPUT));
    if (uSent != argLen)
    {
        isolate->ThrowException(v8::Exception::Error(
            v8::String::NewFromUtf8Literal(isolate, "Failed to send input.")));
        // Failed.
    }
    delete[] inputs;
}

void SendKeyDown(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    SendKey(args, false);
}

void SendKeyUp(const v8::FunctionCallbackInfo<v8::Value> &args)
{
    SendKey(args, true);
}

void Initialize(v8::Local<v8::Object> exports)
{
    NODE_SET_METHOD(exports, "whoami", WhoAmI);
    NODE_SET_METHOD(exports, "sendKeyDown", SendKeyDown);
    NODE_SET_METHOD(exports, "sendKeyUp", SendKeyUp);
}

NODE_MODULE(keyDown, Initialize)
